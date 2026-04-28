import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, Share, TextInput, Clipboard } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Share2, Zap, Trophy, Crown, CheckCircle2, AlertOctagon, Lightbulb, Copy, Heart, Rocket, DollarSign, ShieldCheck, UserCheck, EyeOff } from "lucide-react-native";

export const AmbassadorCard = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [userName, setUserName] = useState("");
  const promoCode = `${userName.toUpperCase().replace(/\s+/g, '')}-20`;
  const hashtag = "#GlowyGoddess";

  const handleActivate = () => {
    if (userName.trim().length < 3) return;
    setHasCode(true);
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `☀️ Join the #GlowyGoddess team! Use my code ${promoCode} for up to 60% OFF Premium! 💸 Get your perfect tan today! ${hashtag}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="mt-8 mb-10 overflow-hidden rounded-[32px] border-[4px] border-white shadow-2xl">
      <LinearGradient
        colors={["#7C3AED", "#EC4899", "#F59E0B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-0 pb-0 px-0 items-center"
      >
        {/* Hero Image */}
        <Image
          source={require("../assets/girl.png")}
          className="w-full h-[300px]"
          resizeMode="contain"
        />

        {/* Action Button / Code Generation */}
        <View className="w-full px-8 -mt-20 mb-6">
        {!hasCode ? (
          <View className="w-full bg-white/10 px-6 pb-6 pt-6 rounded-2xl border border-white/30 items-center">
            <View className="flex-row items-center bg-white h-16 rounded-xl overflow-hidden mb-4 pr-4">
              <TextInput
                placeholder="YOUR NAME"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={userName}
                onChangeText={setUserName}
                textAlign="center"
                className="flex-1 px-5 text-black font-black text-xl"
              />
              <View className="bg-gray-100 px-3 py-2 rounded-lg">
                <Text className="text-gray-400 font-black text-lg">-20</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              className="w-full bg-white h-16 rounded-2xl items-center justify-center shadow-lg mb-3"
            >
              <Text className="font-black text-lg text-[#EC4899]">See Earnings & How-To</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleActivate} disabled={userName.trim().length < 3}>
              <Text className={`font-bold text-xs underline ${userName.trim().length < 3 ? 'text-white/40' : 'text-white'}`}>
                {userName.trim().length < 3 ? 'Enter at least 3 letters' : `Activate: ${promoCode}`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full bg-white p-6 rounded-2xl items-center shadow-2xl">
            <View className="bg-green-100 px-3 py-1 rounded-full mb-3">
              <Text className="text-green-600 font-black text-[10px] uppercase tracking-[1px]">Code Active ⚡️</Text>
            </View>
            <Text className="text-3xl font-black text-black tracking-[2px] mb-5">{promoCode}</Text>
            <TouchableOpacity 
              onPress={handleShare}
              className="bg-black w-full h-16 rounded-xl items-center justify-center flex-row"
            >
              <Share2 size={20} color="white" className="mr-2" />
              <Text className="text-white font-black text-lg text-center">SHARE & EARN CASH</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)} className="mt-4">
              <Text className="text-black/40 font-bold text-xs underline">Review Program Rules</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </LinearGradient>

      {/* CONDITIONS MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] h-[94%] shadow-2xl">
            {/* Modal Header */}
            <View className="p-8 flex-row items-center justify-between border-b border-gray-100">
              <View className="flex-1 items-center">
                <Text className="text-[28px] font-black text-black">Partner Guide</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="absolute right-8">
                <X size={28} color="black" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-8" showsVerticalScrollIndicator={false}>
              {/* Earnings Table Section */}
              <View className="mb-10">
                <View className="flex-row items-center mb-6">
                  <DollarSign size={24} color="#F59E0B" fill="#F59E0B" />
                  <Text className="text-xl font-black ml-3">Earning Table:</Text>
                </View>
                <View className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <CommissionRow 
                    label="Weekly Plan" 
                    discount="€10 → €7 (30% OFF)" 
                    prize="You get €5" 
                  />
                  <View className="h-[1px] bg-gray-200 my-4" />
                  <CommissionRow 
                    label="Quarterly Plan" 
                    discount="€30 → €20 (33% OFF)" 
                    prize="You get €10" 
                  />
                  <View className="h-[1px] bg-gray-200 my-4" />
                  <CommissionRow 
                    label="Annual Plan" 
                    discount="€100 → €40 (60% OFF)" 
                    prize="You get €20" 
                  />
                  <View className="mt-6 pt-6 border-t-2 border-dashed border-gray-200 items-center">
                    <Text className="text-gray-400 font-bold text-xs uppercase tracking-[2px]">Real-time payments</Text>
                    <Text className="text-black font-black text-lg mt-1">Unlimited Earnings 🚀</Text>
                  </View>
                </View>
              </View>

              {/* Section 1: How to Start */}
              <View className="mb-10">
                <View className="flex-row items-center mb-6">
                  <Rocket size={24} color="#7C3AED" />
                  <Text className="text-xl font-black ml-3">How to Start:</Text>
                </View>
                <View className="space-y-6">
                  <StepItem 
                    number="1" 
                    title="Generate your code" 
                    desc="Create your unique discount code to share with your audience." 
                  />
                  <StepItem 
                    number="2" 
                    title="Post on TikTok & Reels" 
                    desc="Upload your tanning progress and routine tagging #GlowyGoddess." 
                  />
                  <StepItem 
                    number="3" 
                    title="Share with Friends" 
                    desc="Everyone wants a massive discount on the best tanning app!" 
                  />
                  <StepItem 
                    number="4" 
                    title="Earn on every Sale" 
                    desc="Get a commission for every single subscription made with your code." 
                  />
                </View>
              </View>

              {/* Section 2: Lifetime Bonus */}
              <View className="bg-pink-50 p-6 rounded-[32px] border border-pink-100 mb-10 items-center">
                 <Trophy size={40} color="#EC4899" fill="#EC4899" className="mb-3" />
                 <Text className="text-xl font-black text-[#EC4899] text-center">The Lifetime Goal</Text>
                 <Text className="text-pink-900 text-center font-bold mt-2 leading-relaxed">
                   Make just <Text className="text-[#EC4899] font-black">10 Sales</Text> and you'll unlock Glowy Premium for yourself <Text className="font-black">FREE FOR LIFE!</Text>
                 </Text>
              </View>

              {/* Section 3: Rules */}
              <View className="mb-10">
                <View className="flex-row items-center mb-6">
                  <ShieldCheck size={24} color="#22C55E" />
                  <Text className="text-xl font-black ml-3">Official Rules:</Text>
                </View>
                <View className="space-y-5">
                  <PolicyItem 
                    icon={<UserCheck size={18} color="#000" />} 
                    title="Age Verification" 
                    desc="You must be at least 18 years old. Earnings are paid after ID verification." 
                  />
                  <PolicyItem 
                    icon={<Heart size={18} color="#EC4899" fill="#EC4899" />} 
                    title="Sexy-But-Safe Policy" 
                    desc="Quality content only. Bikini/Lingerie OK. Full nudity is strictly prohibited and leads to immediate ban." 
                  />
                  <PolicyItem 
                    icon={<AlertOctagon size={18} color="#EF4444" />} 
                    title="Authenticity" 
                    desc="Only original content. Reposting or stealing other creators' photos is not allowed." 
                  />
                  <PolicyItem 
                    icon={<EyeOff size={18} color="#60A5FA" />} 
                    title="No Artificial Traffic" 
                    desc="Bots, fake views, or paid ads (Spark Ads) on your referral link are forbidden." 
                  />
                </View>
              </View>

              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CommissionRow = ({ label, discount, prize }: { label: string, discount: string, prize: string }) => (
  <View>
    <View className="flex-row items-center justify-between">
      <Text className="text-black font-black text-lg">{label}</Text>
      <View className="bg-green-100 px-3 py-1 rounded-lg">
        <Text className="text-green-700 font-black text-xs">{prize}</Text>
      </View>
    </View>
    <Text className="text-gray-400 font-bold text-sm mt-1">{discount}</Text>
  </View>
);

const StepItem = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <View className="flex-row items-start">
    <View className="h-10 w-10 bg-gray-900 rounded-full items-center justify-center mr-4">
      <Text className="text-white font-black text-lg">{number}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-black font-black text-lg mb-1">{title}</Text>
      <Text className="text-gray-600 font-medium leading-relaxed">{desc}</Text>
    </View>
  </View>
);

const PolicyItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <View className="flex-row items-start mb-2">
    <View className="h-10 w-10 bg-gray-50 rounded-xl items-center justify-center mr-4 border border-gray-100">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-black font-black text-[13px] uppercase tracking-[1px]">{title}</Text>
      <Text className="text-gray-500 text-xs font-medium leading-relaxed">{desc}</Text>
    </View>
  </View>
);
