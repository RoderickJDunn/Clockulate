import React from "react";
import {
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback
} from "react-native";

import {
    Container,
    Content,
    Form,
    Item,
    Input,
    Icon,
    ListItem,
    CheckBox,
    List,
    Picker,
    StyleProvider,
    Text
} from "native-base";
import material from "../../native-base-theme/variables/material";
import getTheme from "../../native-base-theme/components";

import ExpListItem from "../components/expandable-listitem";
// TODO:
export default class Settings extends React.Component {
    /*
    Props: 
     */
    static navigationOptions = () => ({
        title: "Settings"
    });

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    render() {
        return (
            <Container>
                <Content>
                    <List>
                        <ListItem itemDivider>
                            <Text>General</Text>
                        </ListItem>
                        <ExpListItem
                            expandedChildren={
                                <Text>
                                    When in the Alarms List screen, your screen
                                    will be turned off when placed face down.
                                    Clockulate will continue to run.
                                </Text>
                            }
                        >
                            <Text>Turn off display when face down</Text>
                            <StyleProvider style={getTheme(material)}>
                                <CheckBox checked={true} />
                            </StyleProvider>
                        </ExpListItem>
                        <ListItem>
                            <Input
                                disabled
                                placeholder="Prevent phone from locking"
                            />
                            <CheckBox checked={false} />
                        </ListItem>
                        <ListItem itemDivider>
                            <Text>Edit Alarm Screen</Text>
                        </ListItem>
                        <ListItem>
                            <Input disabled placeholder="Show mode name" />
                            <Picker
                                mode="dropdown"
                                iosIcon={<Icon name="ios-arrow-down-outline" />}
                                style={{ width: undefined }}
                                placeholder="When changed"
                                placeholderStyle={{ color: "#bfc6ea" }}
                                placeholderIconColor="#007aff"
                                selectedValue={1}
                                // onValueChange={this.onValueChange2.bind(this)}
                            >
                                <Picker.Item label="Always" value="key0" />
                                <Picker.Item
                                    label="When mode changes"
                                    value="key1"
                                />
                                <Picker.Item label="Never" value="key2" />
                            </Picker>
                        </ListItem>
                        <ListItem>
                            <Input
                                disabled
                                placeholder="Always show hours of sleep"
                            />
                            <CheckBox checked={false} />
                        </ListItem>
                    </List>
                </Content>
            </Container>
        );
    }
}
