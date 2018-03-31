import React, { Component } from "react";
import PushNotification from "react-native-push-notification";
import { PushNotificationIOS } from "react-native";

export default class PushController extends Component {
    count = 0;
    componentDidMount() {
        PushNotification.configure({
            onNotification: function(notification) {
                console.log("-Notification fired!!!!: ", notification);
                this.count++;
                notification.finish(PushNotificationIOS.FetchResult.NoData);

                if (notification.userInteraction == true) {
                    // PushNotification.cancelLocalNotifications({ id: "" });
                    PushNotification.cancelLocalNotifications({
                        id: notification.data.id
                    });
                } else if (notification.foreground == false) {
                    let now = new Date();
                    if (this.count < 5) {
                        console.log("Resetting the notitication");
                        now.setSeconds(now.getSeconds() + 60);
                        console.log("New Date: " + now);
                        // PushNotification.localNotificationSchedule({
                        //     message: "Notification #" + this.count, // (required)
                        //     date: now,
                        //     playSound: true,
                        //     soundName: "super_ringtone.mp3",
                        //     foreground: true,
                        //     repeatType: "minute",
                        //     actions: '["Snooze", "Turn Off"]'
                        // });
                    }
                }
            },
            permissions: {
                alert: true,
                badge: true,
                sound: true
            },
            popInitialNotification: false
        });
    }
    render() {
        return null;
    }
}
