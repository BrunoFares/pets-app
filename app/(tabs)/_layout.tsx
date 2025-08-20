import { Footer } from "@/components/Footer";
import { Tabs } from "expo-router";
import React from "react";

const TabsLayout = () => {
    return (
        <Tabs tabBar={(props: any) => <Footer {...props} />} screenOptions={{headerShown: false}}>
            <Tabs.Screen name="index" options={{title: 'Home'}} />
            <Tabs.Screen name="explore" options={{title: 'Explore'}} />
            <Tabs.Screen name="profile" options={{title: 'My Profile'}} />            
            <Tabs.Screen name="chatbot-screen" options={{title: 'Chatbot'}} />
        </Tabs>
    )
}

export default TabsLayout;