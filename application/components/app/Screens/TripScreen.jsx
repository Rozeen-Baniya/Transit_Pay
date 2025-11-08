import { Pressable, Text, View, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react-native'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllTrips } from '../../../Redux/Reducers/tripSlice'
import { loadToken } from '../../../Redux/Reducers/WalletSlice'

const TripScreen = ({ navigation }) => {

  const {userId} = useSelector(state=> state.wallet);
  const {trips} = useSelector(state=> state.trip)

  const dispatch = useDispatch();

  console.log(trips)

  useEffect(()=>{
    dispatch(fetchAllTrips(userId))
    dispatch(loadToken())
  },[userId])

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
        {trips?.trips?.map((trip, index) => (
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
