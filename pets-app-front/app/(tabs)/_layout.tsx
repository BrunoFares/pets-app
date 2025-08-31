import { Footer } from "@/components/Footer";
import { GlobalProvider } from "@/contexts/GlobalProvider";
import { Tabs } from "expo-router";
import React from "react";

const TabsLayout = () => {
    return (
        <GlobalProvider>
            <Tabs tabBar={(props: any) => <Footer {...props} />} screenOptions={{headerShown: false}}>
                <Tabs.Screen name="index" options={{title: 'Home'}} />
                <Tabs.Screen name="explore" options={{title: 'Explore'}} />
                <Tabs.Screen name="chatbot" options={{title: 'Bot'}} />
                <Tabs.Screen name="forum" options={{title: 'Forum'}} />
                <Tabs.Screen name="profile" options={{title: 'Profile'}} />
            </Tabs>
        </GlobalProvider>
    )
}

export default TabsLayout;