import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { Edit } from "lucide-react-native";

const ProfileScreen = ({ navigation, route }) => {
  const user = route.params?.user || {
    firstName: "Prashant",
    lastName: "Adhikari",
    username: "pr4xnt",
    email: "pr4xnt@example.com",
    phoneNumber: "+9779800000000",
    address: "Kathmandu, Nepal",
    nationalId: "Citizenship",
    nationalIdNumber: "1234567890",
    gender: "male",
    dateOfBirth: "2002-03-10",
    profileAvatar: "https://via.placeholder.com/150",
    isVerified: true,
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-6 py-8">
      {/* CARD */}
      <View className="bg-white rounded-2xl shadow-sm p-8">

        {/* ROW: Avatar + Basic Info */}
        <View className="flex-row items-center mb-8">
          <Image
            source={{ uri: user.profileAvatar }}
            className="w-20 h-20 rounded-full border border-gray-300"
          />

          <View className="ml-6">
            <Text className="text-xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-gray-500">@{user.username}</Text>

            {user.isVerified && (
              <Text className="text-green-600 text-xs mt-1 font-medium">Verified Account ✅</Text>
            )}
          </View>

          <TouchableOpacity 
            className="ml-auto border border-gray-300 px-4 py-2 rounded-lg"
          >
            <View className=""><Edit/></View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="border-t border-gray-200 my-4" />

        {/* DETAILS GRID */}
        <View className="gap-y-4">

          <Info label="Email" value={user.email} />
          <Info label="Phone" value={user.phoneNumber} />
          <Info label="Gender" value={user.gender} />
          <Info
            label="Date of Birth"
            value={new Date(user.dateOfBirth).toDateString()}
          />
          <Info label="Address" value={user.address} />
          <Info label="National ID" value={`${user.nationalId} - ${user.nationalIdNumber}`} />

        </View>

        {/* Divider */}
        <View className="border-t border-gray-200 my-4" />

        {/* BUTTONS */}
        <View className="flex-row gap-x-3 mt-2">
          <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg items-center">
            <Text className="text-white font-semibold text-sm">Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 border border-red-500 py-3 rounded-lg items-center">
            <Text className="text-red-500 font-semibold text-sm">Deactivate</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Logout */}
      <TouchableOpacity className="mt-6 items-center" onPress={() => {}}>
        <Text className="text-red-600 font-medium">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const Info = ({ label, value }) => (
  <View>
    <Text className="text-gray-400 text-xs uppercase tracking-wide">{label}</Text>
    <Text className="text-gray-800 font-medium text-sm">{value}</Text>
  </View>
);
