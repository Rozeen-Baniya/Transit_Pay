#include <SPI.h>
#include <Adafruit_PN532.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <ESP8266HTTPClient.h>

// --- PN532 SPI Pins ---
#define PN532_SS   D4
#define PN532_SCK  D5
#define PN532_MOSI D7
#define PN532_MISO D6

// --- Buzzer Pin ---
#define BUZZER_PIN D1

const char* apiHost = "https://codarambha-git-force-transit-pay-ba.vercel.app";

Adafruit_PN532 nfc(PN532_SS);

void sendPayload(String payload) {
 if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping API request.");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  Serial.println("Sending GET request to API root...");
  http.begin(client, apiHost);
  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println("Server Response: " + response);

    // Success beep
    if (httpResponseCode == 200) {
      tone(BUZZER_PIN, 2500, 700);
    } else {
      tone(BUZZER_PIN, 500, 1000);
    }
  } else {
    Serial.print("HTTP GET Failed: ");
    Serial.println(http.errorToString(httpResponseCode));
    // Fast failure beep
    for (int i = 0; i < 3; i++) {
      tone(BUZZER_PIN, 1000);
      delay(100);
      noTone(BUZZER_PIN);
      delay(100);
    }
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);

  WiFiManager wifiManager;
  wifiManager.setConfigPortalTimeout(120);

  if (!wifiManager.autoConnect("NFC_Reader_Setup")) {
    Serial.println("WiFi setup failed.");
    for (int i = 0; i < 10; i++) {
      tone(BUZZER_PIN, 500);
      delay(50);
      noTone(BUZZER_PIN);
      delay(50);
    }
    while (1);
  }

  Serial.println("WiFi connected!");
  Serial.println("IP: " + WiFi.localIP().toString());

  // PN532 setup
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found!");
    tone(BUZZER_PIN, 500);
    delay(1000);
    noTone(BUZZER_PIN);
    while (1);
  }

  nfc.SAMConfig();
  Serial.println("Waiting for NFC card...");
}

void loop() {
  uint8_t success;
  uint8_t uid[7];
  uint8_t uidLength;

  success = nfc.inListPassiveTarget();
  if (!success) {
    delay(500);
    return;
  }

  Serial.println("Card detected!");

  uint8_t response[255];
  uint8_t responseLength = sizeof(response);

  // Select NDEF application
  uint8_t selectApdu[] = { 0x00, 0xA4, 0x04, 0x00, 0x07, 0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00 };
  success = nfc.inDataExchange(selectApdu, sizeof(selectApdu), response, &responseLength);

  if (!success || responseLength < 2 || response[responseLength - 2] != 0x90) {
    Serial.println("Failed to select NDEF app.");
    tone(BUZZER_PIN, 1000, 500);
    return;
  }

  // Select NDEF file (0xE104)
  uint8_t selectFileApdu[] = { 0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x04 };
  responseLength = sizeof(response);
  success = nfc.inDataExchange(selectFileApdu, sizeof(selectFileApdu), response, &responseLength);

  if (!success || responseLength < 2 || response[responseLength - 2] != 0x90) {
    Serial.println("Failed to select NDEF file.");
    tone(BUZZER_PIN, 1000, 500);
    return;
  }

  // Read NDEF length
  uint8_t readNlenApdu[] = { 0x00, 0xB0, 0x00, 0x00, 0x02 };
  responseLength = sizeof(response);
  success = nfc.inDataExchange(readNlenApdu, sizeof(readNlenApdu), response, &responseLength);

  if (!success || responseLength < 2) {
    Serial.println("Failed to read NDEF length.");
    tone(BUZZER_PIN, 1000, 500);
    return;
  }

  uint16_t ndefLength = (response[0] << 8) | response[1];
  Serial.println("NDEF length: " + String(ndefLength));

  // Read NDEF payload in chunks
  String payload = "";
  uint16_t offset = 0;
  while (offset < ndefLength) {
    uint8_t chunkSize = (ndefLength - offset > 240) ? 240 : (ndefLength - offset);
    uint8_t readApdu[] = { 0x00, 0xB0, (uint8_t)(offset >> 8), (uint8_t)(offset & 0xFF), chunkSize };
    responseLength = sizeof(response);

    success = nfc.inDataExchange(readApdu, sizeof(readApdu), response, &responseLength);
    if (!success || responseLength < 2 || response[responseLength - 2] != 0x90) {
      Serial.println("Failed reading NDEF chunk.");
      tone(BUZZER_PIN, 1000, 500);
      return;
    }

    for (int i = 0; i < responseLength - 2; i++) {
      payload += (char)response[i];
    }
    offset += chunkSize;
  }

  Serial.println("NDEF Payload: " + payload);

  // Send via GET request
  sendPayload(payload);
  tone(BUZZER_PIN, 2500, 700);

  delay(1000); // Wait before next card read
}
