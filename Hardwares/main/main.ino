#include <SPI.h>
#include <Adafruit_PN532.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>

// --- PN532 SPI Pins ---
#define PN532_SS   D4
#define PN532_SCK  D5
#define PN532_MOSI D7
#define PN532_MISO D6

// --- Buzzer Pin ---
#define BUZZER_PIN D1

const char* apiHost = "https://codarambha-git-force-transit-pay-ba.vercel.app";

Adafruit_PN532 nfc(PN532_SS);

void sendPayload(String userId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping API request.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();  // Skip SSL verification

  HTTPClient http;
  String url = String(apiHost) + "/api/trips";

  // Prepare JSON body
  String postData = "{\"transportId\":\"690f8186f2244f32447f8fd2\",\"userId\":\"" + userId + "\"}";

  Serial.println("Sending POST request to: " + url);
  Serial.println("Payload: " + postData);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(postData);

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 200 || httpResponseCode == 201) {
      String response = http.getString();
      Serial.println("Server Response: " + response);
      tone(BUZZER_PIN, 2500, 700); // success beep
    } else {
      Serial.println("Error response from server.");
      tone(BUZZER_PIN, 500, 1000); // failure beep
    }
  } else {
    Serial.print("HTTP POST Failed: ");
    Serial.println(http.errorToString(httpResponseCode));
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

  Serial.println("WiFi connected! IP: " + WiFi.localIP().toString());

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
  if (!nfc.inListPassiveTarget()) {
    delay(500);
    return;
  }

  Serial.println("Card detected!");

  uint8_t response[255];
  uint8_t responseLength = sizeof(response);

  // Select NDEF application
  uint8_t selectApdu[] = {0x00,0xA4,0x04,0x00,0x07,0xD2,0x76,0x00,0x00,0x85,0x01,0x01,0x00};
  if (!nfc.inDataExchange(selectApdu,sizeof(selectApdu),response,&responseLength) || responseLength < 2 || response[responseLength-2] != 0x90) {
    Serial.println("Failed to select NDEF app.");
    tone(BUZZER_PIN,1000,500);
    return;
  }

  // Select NDEF file
  uint8_t selectFileApdu[] = {0x00,0xA4,0x00,0x0C,0x02,0xE1,0x04};
  responseLength = sizeof(response);
  if (!nfc.inDataExchange(selectFileApdu,sizeof(selectFileApdu),response,&responseLength) || responseLength < 2 || response[responseLength-2] != 0x90) {
    Serial.println("Failed to select NDEF file.");
    tone(BUZZER_PIN,1000,500);
    return;
  }

  // Read NDEF length
  uint8_t readNlenApdu[] = {0x00,0xB0,0x00,0x00,0x02};
  responseLength = sizeof(response);
  if (!nfc.inDataExchange(readNlenApdu,sizeof(readNlenApdu),response,&responseLength) || responseLength < 2) {
    Serial.println("Failed to read NDEF length.");
    tone(BUZZER_PIN,1000,500);
    return;
  }

  uint16_t ndefLength = (response[0]<<8) | response[1];
  Serial.println("NDEF length: " + String(ndefLength));

  // Read NDEF payload
  String payload = "";
  uint16_t offset = 0;
  while (offset < ndefLength) {
    uint8_t chunkSize = (ndefLength - offset > 240) ? 240 : (ndefLength - offset);
    uint8_t readApdu[] = {0x00,0xB0,(uint8_t)(offset>>8),(uint8_t)(offset&0xFF),chunkSize};
    responseLength = sizeof(response);

    if (!nfc.inDataExchange(readApdu,sizeof(readApdu),response,&responseLength) || responseLength < 2 || response[responseLength-2] != 0x90) {
      Serial.println("Failed reading NDEF chunk.");
      tone(BUZZER_PIN,1000,500);
      return;
    }

    for (int i=0; i<responseLength-2; i++) {
      payload += (char)response[i];
    }
    offset += chunkSize;
  }

  Serial.println("Raw NDEF Payload: " + payload);

  // --- CLEAN payload: keep only last 24 chars (MongoDB ObjectId) ---
  String userId = "";
  if (payload.length() >= 24) {
    userId = payload.substring(payload.length() - 24);
  } else {
    Serial.println("Invalid payload length");
    tone(BUZZER_PIN,500,1000);
    return;
  }

  Serial.println("Clean userId: " + userId);

  // Send POST request
  sendPayload(userId);

  delay(1000);
}
