import React from "react";
import { View, StyleSheet, Text, Linking } from "react-native";

const INTRO = `The Clockulate app was built by Roderick Dunn as a Freemium app. This SERVICE is provided by Roderick Dunn at no cost and is intended for use as is.

This page is used to inform visitors regarding my policies with the collection, use, and disclosure of Personal Information if anyone decided to use my Service.

If you choose to use my Service, then you agree to the collection and use of information in relation to this policy. The Personal Information that I collect is used for providing and improving the Service. I will not use or share your information with anyone except as described in this Privacy Policy.

The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which is accessible at Clockulate unless otherwise defined in this Privacy Policy.`;

const H_INFO_COLL = "Information Collection and Use";

const B_INFO_COLL = `For a better experience, while using our Service, I may require you to provide us with certain personally identifiable information. The information that I request will be retained on your device and is not collected by me in any way.

The app does use third party services that may collect information used to identify you.`;

const SH_INFO_COLL =
    "Link to privacy policy of third party service providers used by the app";

const BUL_INFO_COLL = ["AdMob", "AdFalcon", "AppLovin", "InMobi"];

const H_LOG_DATA = "Log Data";
const B_LOG_DATA =
    "I want to inform you that whenever you use my Service, in a case of an error in the app I collect data and information (through third party products) on your phone called Log Data. This Log Data may include information such as your device Internet Protocol (“IP”) address, device name, operating system version, the configuration of the app when utilizing my Service, the time and date of your use of the Service, and other statistics.";

const H_COOKIES = "Cookies";
const B_COOKIES = `Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent to your browser from the websites that you visit and are stored on your device's internal memory.

This Service does not use these “cookies” explicitly. However, the app may use third party code and libraries that use “cookies” to collect information and improve their services. You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device. If you choose to refuse our cookies, you may not be able to use some portions of this Service.`;

const H_SERV_PROV = "Service Providers";
const B_SERV_PROV =
    "I may employ third-party companies and individuals due to the following reasons:";

const BUL_SERV_PROV = [
    "To facilitate our Service;",
    "To provide the Service on our behalf;",
    "To perform Service-related services; or",
    "To assist us in analyzing how our Service is used."
];

const B_SERV_PROV2 = `I want to inform users of this Service that these third parties have access to your Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.`;

const H_SECURITY = "Security";
const B_SECURITY = `I value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and I cannot guarantee its absolute security.`;

const H_LINKS = "Links to Other Sites";
const B_LINKS = `This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by me. Therefore, I strongly advise you to review the Privacy Policy of these websites. I have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.`;

const H_CHILDREN = "Children’s Privacy";
const B_CHILDREN =
    "These Services do not address anyone under the age of 13. I do not knowingly collect personally identifiable information from children under 13. In the case I discover that a child under 13 has provided me with personal information, I immediately delete this from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact me so that I will be able to do necessary actions.";

const H_CHANGES = "Changes to This Privacy Policy";
const B_CHANGES =
    "I may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. I will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately after they are posted on this page.";

const H_CONTACT = "Contact Us";
const B_CONTACT =
    "If you have any questions or suggestions about my Privacy Policy, do not hesitate to contact me.";

const FOOTER =
    "This privacy policy page was created at privacypolicytemplate.net and modified/generated by App Privacy Policy Generator";

const contactLink = "http://www.clockulate.ca/contact";

function renderBulletPoint(text, link) {
    let style;
    if (link) {
        style = styles.link;
    }
    return (
        <View style={styles.bulletPoint}>
            <Text>
                {`\u2022   `}
                <Text
                    style={[style]}
                    onPress={() => {
                        if (link) {
                            Linking.openURL(link);
                        }
                    }}
                >
                    {text}
                </Text>
            </Text>
        </View>
    );
}

export default function renderPrivacyPolicy() {
    return (
        <View style={styles.container}>
            <Text style={styles.bodyText}>{INTRO}</Text>
            <Text style={styles.headingText}>{H_INFO_COLL}</Text>
            <Text style={styles.bodyText}>{B_INFO_COLL}</Text>
            <Text style={styles.subHeadingText}>{SH_INFO_COLL}</Text>
            {renderBulletPoint(
                BUL_INFO_COLL[0],
                "https://support.google.com/admob/answer/6128543?hl=en"
            )}
            {renderBulletPoint(
                BUL_INFO_COLL[1],
                "http://www.adfalcon.com/en/tech-policy.html"
            )}
            {renderBulletPoint(
                BUL_INFO_COLL[2],
                "https://www.applovin.com/privacy/"
            )}
            {renderBulletPoint(
                BUL_INFO_COLL[3],
                "https://www.inmobi.com/privacy-policy/"
            )}
            <Text style={styles.headingText}>{H_LOG_DATA}</Text>
            <Text style={styles.bodyText}>{B_LOG_DATA}</Text>
            <Text style={styles.headingText}>{H_COOKIES}</Text>
            <Text style={styles.bodyText}>{B_COOKIES}</Text>
            <Text style={styles.headingText}>{H_SERV_PROV}</Text>
            <Text style={styles.bodyText}>{B_SERV_PROV}</Text>
            {renderBulletPoint(BUL_SERV_PROV[0])}
            {renderBulletPoint(BUL_SERV_PROV[1])}
            {renderBulletPoint(BUL_SERV_PROV[2])}
            {renderBulletPoint(BUL_SERV_PROV[3])}
            <View style={{ height: 8 }} />
            <Text style={styles.bodyText}>{B_SERV_PROV2}</Text>
            <Text style={styles.headingText}>{H_SECURITY}</Text>
            <Text style={styles.bodyText}>{B_SECURITY}</Text>
            <Text style={styles.headingText}>{H_LINKS}</Text>
            <Text style={styles.bodyText}>{B_LINKS}</Text>
            <Text style={styles.headingText}>{H_CHILDREN}</Text>
            <Text style={styles.bodyText}>{B_CHILDREN}</Text>
            <Text style={styles.headingText}>{H_CHANGES}</Text>
            <Text style={styles.bodyText}>{B_CHANGES}</Text>
            <Text style={styles.headingText}>{H_CONTACT}</Text>
            <Text style={styles.bodyText}>{B_CONTACT}</Text>
            <Text
                onPress={() => {
                    Linking.openURL(contactLink).catch(err => {
                        alert(
                            "An error occurred. Unable to open Clockulate contact page."
                        );
                    });
                }}
                style={styles.link}
            >
                Get in Touch
            </Text>

            <Text style={styles.footer}>{FOOTER}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8
    },
    headingText: {
        // fontSize: scaleByFactor(25, 0.7),
        paddingTop: 25,
        paddingBottom: 10,
        fontWeight: "bold"
    },
    subHeadingText: {
        // fontSize: scaleByFactor(25, 0.7),
        paddingTop: 15,
        paddingBottom: 6,
        fontStyle: "italic"
        // fontWeight: "bold"
    },
    bodyText: {
        // fontSize: scaleByFactor(13, 0.7)
    },
    bulletPoint: {
        paddingLeft: 10
    },
    link: {
        color: "blue"
    },
    footer: {
        marginTop: 25,
        fontStyle: "italic"
    }
});

// export default PRIVACY_POLICY;
