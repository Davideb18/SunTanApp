import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Pressable, Alert } from 'react-native';
import { X, CheckCircle2, Camera, Music2, MessageCircle } from 'lucide-react-native';
import { useTranslation } from '@/constants/i18n';
import { COLORS } from '@/constants/theme';
import { submitAmbassadorRequest } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface AmbassadorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AmbassadorModal = ({ visible, onClose }: AmbassadorModalProps) => {
  const t = useTranslation();
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!handle.trim()) {
      Alert.alert(t.socialHandle, t.enterHandle);
      return;
    }

    setLoading(true);
    const { error } = await submitAmbassadorRequest({ platform, handle: handle.trim() });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setHandle('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }} onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="overflow-hidden rounded-[44px] border-[3px] border-white/80 shadow-2xl">
            <BlurView intensity={100} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <LinearGradient
                colors={["#A855F7", "#F472B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 24, paddingBottom: 16 }}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-2xl font-black text-white italic">{t.becomeAmbassador}</Text>
                  <TouchableOpacity onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <X size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={{ padding: 24, paddingTop: 16 }}>
                {submitted ? (
                  <View className="items-center py-8">
                    <CheckCircle2 size={64} color="#4ADE80" />
                    <Text className="text-[24px] font-black text-black mt-6 text-center">{t.requestSent}</Text>
                    <Text className="text-sm font-medium text-black/50 mt-2 text-center">{t.requestSentDesc}</Text>
                    <TouchableOpacity 
                      onPress={handleClose}
                      className="mt-10 bg-black px-10 py-4 rounded-2xl"
                    >
                      <Text className="text-sm font-black text-white uppercase tracking-[1px]">{t.done}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text className="text-[26px] font-black text-black mb-6 text-center leading-[30px] italic">
                      {t.language === 'it' 
                        ? "PROMUOVI GLOWY NELLE TUE STORIE!" 
                        : "PROMOTE GLOWY IN YOUR STORIES!"}
                    </Text>
                    
                    <Text className="text-sm font-medium text-black/60 mb-4 text-center">{t.ambassadorDesc}</Text>
                    
                    <View className="bg-black/5 p-4 rounded-3xl border border-black/10 mb-6">
                      <View className="flex-row items-center mb-2 justify-center">
                         <MessageCircle size={14} color="black" opacity={0.6} />
                         <Text className="ml-2 text-[10px] font-black text-black/60 uppercase tracking-[2px]">{t.language === 'it' ? "AVVISO" : "NOTICE"}</Text>
                      </View>
                      <Text className="text-black/80 text-xs font-bold leading-5 text-center">
                        {t.socialContactNotice}
                      </Text>
                    </View>

                    <View className="bg-black/5 p-4 rounded-3xl border border-black/10 mb-8">
                      <Text className="text-[10px] font-black text-black/40 uppercase tracking-[2px] mb-1 text-center">{t.language === 'it' ? "ISTRUZIONI" : "INSTRUCTIONS"}</Text>
                      <Text className="text-black/80 text-xs font-bold leading-5 text-center">
                        {t.language === 'it' 
                          ? "Pubblica una storia o un post, taggaci e usa l'hashtag " 
                          : "Share a story or a post, tag us and use the hashtag "}
                        <Text className="text-purple-600">#GlowyUp</Text>
                      </Text>
                    </View>

                    <View className="mb-6">
                      <Text className="text-[10px] font-black uppercase tracking-[2px] text-black/40 mb-3 text-center">{t.platform}</Text>
                      <View className="flex-row gap-4">
                        <TouchableOpacity 
                          onPress={() => setPlatform('instagram')}
                          className={`flex-1 h-14 flex-row items-center justify-center rounded-2xl border ${platform === 'instagram' ? 'border-black bg-black/10' : 'border-black/10 bg-black/5'}`}
                        >
                          <Camera size={18} color="black" />
                          <Text className={`ml-2 text-xs font-black text-black ${platform === 'instagram' ? 'opacity-100' : 'opacity-40'}`}>Instagram</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => setPlatform('tiktok')}
                          className={`flex-1 h-14 flex-row items-center justify-center rounded-2xl border ${platform === 'tiktok' ? 'border-black bg-black/10' : 'border-black/10 bg-black/5'}`}
                        >
                          <Music2 size={18} color="black" />
                          <Text className={`ml-2 text-xs font-black text-black ${platform === 'tiktok' ? 'opacity-100' : 'opacity-40'}`}>TikTok</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mb-10">
                      <Text className="text-[10px] font-black uppercase tracking-[2px] text-black/40 mb-3 text-center">{t.socialHandle}</Text>
                      <View className="h-14 bg-black/5 border border-black/10 rounded-2xl px-5 justify-center">
                        <TextInput 
                          value={handle}
                          onChangeText={setHandle}
                          placeholder={t.enterHandle}
                          placeholderTextColor="rgba(0,0,0,0.2)"
                          style={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      onPress={handleSubmit}
                      disabled={loading}
                      className="h-16 bg-black rounded-2xl items-center justify-center shadow-2xl"
                    >
                      {loading ? <ActivityIndicator color="white" /> : <Text className="text-sm font-black text-white uppercase tracking-[1px]">{t.submitRequest}</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
