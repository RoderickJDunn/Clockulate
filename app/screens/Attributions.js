import React from "react";
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    InteractionManager,
    Linking
} from "react-native";

import Colors from "../styles/colors";
import * as License from "../data/licenses";
import realm from "../data/DataSchemas";

export default class Attributions extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.state.params.title
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            libraries: [],
            sounds: []
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.setState({
                libraries: require("../../attr_metadata.json"),
                sounds: realm
                    .objects("Sound")
                    .filtered("source = 'Purple Planet'")
            });
        });
    }

    AttrSection = props => {
        let { name, subtitle } = props.info;
        return (
            <View style={styles.attrSection}>
                <View style={styles.sectionTitle}>
                    <Text style={styles.sectionTitleText}>{name}</Text>
                    {subtitle && (
                        <Text style={styles.sectionTitleText}>{subtitle}</Text>
                    )}
                </View>
                {props.children}
            </View>
        );
    };

    renderLibItem = (item, idx) => {
        let license = "";
        switch (item.license) {
            case "MIT":
                license = License.MIT;
                break;
            case "BSD-2-Clause":
                license = License.BSD2;
            case "Apache-2.0":
            case "Apache":
                license = License.APACHE2;
                break;
            case "ISC":
                license = License.ISC;
                break;
            default:
                if (item.name == "Realm") {
                    license = License.REALM;
                    /** else if: I may need to add further specific licenses here */
                } else {
                    license = // DEV:
                        "@#($*&@#$(*& SSDF SDF UNKNOWN LICENSE TYPE @#)(*$&DFISDFOIHSDFOISD FSDF \nW(#########***********\n\n\n\n\n32478DDDDDDD62346^#^@#*&$#@*&$^@#*$&^@#*&$^87";
                }
        }

        return (
            <View style={styles.softwareItem} key={item.name}>
                <Text style={styles.itemTitleText}>{item.name}</Text>
                <View style={{ marginTop: 15 }}>
                    <View style={{ marginBottom: 5 }}>
                        <Text style={styles.copyrightHeader}>
                            {License.HEADER(item.year, item.author)}
                        </Text>
                        <Text style={styles.softwareDetail}>{license}</Text>
                    </View>
                    {/* <View style={{ flexDirection: "row" }}>
                        <Text style={styles.softwareDetail}>
                            {item.repository}
                        </Text>
                    </View> */}
                </View>
            </View>
        );
    };

    renderSoundItem = item => {
        return (
            <View style={{ marginLeft: 10 }} key={item.id}>
                <Text>
                    {`\u2022   `}
                    <Text>{item.displayName}</Text>
                </Text>
            </View>
        );
    };

    render() {
        let { libraries, sounds } = this.state;
        console.log("sounds", sounds);
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: Colors.backgroundGrey }}
            >
                <ScrollView
                    style={{
                        flex: 1,
                        backgroundColor:
                            Colors.backgroundGrey /* , justifyContent: "center" */
                    }}
                >
                    {libraries.length > 0 && (
                        <>
                            <this.AttrSection
                                info={{ name: "Third Party Source Code" }}
                            >
                                {libraries.map(item =>
                                    this.renderLibItem(item)
                                )}
                            </this.AttrSection>
                            <this.AttrSection
                                info={{
                                    name: "Sounds"
                                }}
                            >
                                <Text
                                    onPress={() =>
                                        Linking.openURL(
                                            "https://www.purple-planet.com"
                                        )
                                    }
                                >
                                    Music: https://www.purple-planet.com
                                </Text>
                                <Text style={{ marginVertical: 10 }}>
                                    The following royalty-free sounds were
                                    downloaded from Purple Planet
                                </Text>
                                {sounds.map(item => this.renderSoundItem(item))}
                                <Text style={{ marginVertical: 10 }}>
                                    All other sounds were originally created for
                                    this app: Copyright (c) 2018 Roderick Dunn
                                </Text>
                            </this.AttrSection>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    attrSection: {
        paddingHorizontal: 10
    },
    sectionTitle: {
        paddingVertical: 25
    },
    sectionTitleText: {
        fontSize: 22,
        fontWeight: "bold"
    },
    itemTitleText: {
        fontSize: 17,
        fontWeight: "bold"
    },
    softwareItem: {
        marginBottom: 15
    },
    copyrightHeader: {
        marginBottom: 5
    },
    softwareDetailRow: {
        marginTop: 5
    },
    softwareDetail: {
        marginTop: 5
    }
});
