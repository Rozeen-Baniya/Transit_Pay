import { Pressable, Text, View, ScrollView } from 'react-native'
import React from 'react'
import { ArrowLeft } from 'lucide-react-native'

const TripScreen = ({ navigation }) => {

  const data = [
    {
      from: 'KMC',
      to: 'LMC',
      date: '2023-10-02',
      bus: 'Sajha Yatayat BA62028',
      status: 'Completed',
      fare: "NPR 50.00",
      startTime: '08:00 AM',
      endTime: '08:30 AM',
    },
    {
      from: 'BANEPA',
      to: 'KTM',
      date: '2023-10-04',
      bus: 'Mahanagar Yatayat BA62028',
      status: 'Completed',
      fare: "NPR 120.00",
      startTime: '09:00 AM',
      endTime: '10:15 AM',
    },
    {
      from: 'BAGBAZAR',
      to: 'SORAKHUTTE',
      date: '2023-10-06',
      bus: 'Nepal Yatayat BA62028',
      status: 'Completed',
      fare: "NPR 25.00",
      startTime: '11:00 AM',
      endTime: '11:45 AM',
    },
    {
      from: 'BANESHWOR',
      to: 'TBD',
      date: '2023-10-08',
      bus: 'Sajha Yatayat BA62028',
      status: 'Running',
      fare: "NPR 40.00",
      startTime: '01:00 PM',
      endTime: 'Ongoing',
    },
  ];

  return (
    <ScrollView className="bg-white flex-1">

      {/* HEADER */}
      <View className="bg-blue-500 pb-6 px-5 pt-10 rounded-b-3xl">
        <Pressable onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>

        <View className="flex-row mt-5 items-center">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
            <Text className="text-blue-500 text-lg font-bold">P</Text>
          </View>

          <View className="ml-3">
            <Text className="text-white text-lg font-bold">Prashant Adhikari</Text>
            <Text className="text-gray-100 text-xs">@pr4xnt</Text>
          </View>
        </View>
      </View>

      {/* TRIP LIST */}
      <View className="mt-2 px-4 pb-8">
        {data.map((trip, index) => (
          <View key={index} className="bg-gray-50 p-4 rounded-xl mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              
              <Text className="font-semibold text-base">
                {trip.from} ➝ {trip.to}
              </Text>

              <View className={`px-2 py-1 rounded-full 
                ${trip.status === 'Completed' ? 'bg-green-200' : 'bg-blue-200'}
              `}>
                <Text className={`text-xs font-semibold 
                  ${trip.status === 'Completed' ? 'text-green-700' : 'text-blue-700'}`}>
                  {trip.status}
                </Text>
              </View>

            </View>

            <Text className="text-gray-600 text-xs mb-1">{trip.date}</Text>
            <Text className="text-gray-600 text-xs mb-1">{trip.bus}</Text>
            <Text className="text-gray-600 text-xs mb-1">{trip.fare}</Text>
            <Text className="text-gray-600 text-xs">⏱ {trip.startTime} - {trip.endTime}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

export default TripScreen
