/**
 * Created by rdunn on 2017-07-15.
 */

import React from "react";
import { StyleSheet, TouchableWithoutFeedback, View, Text } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import TaskItem from "./task-item";
import Colors from "../styles/colors";

class TaskList extends React.Component {
    _keyExtractor = (item, index) => item.id;

    _renderItem = ({ item, index, move, moveEnd, isActive: isMoving }) => {
        let { onSnapTask, sortHandlers, ...other } = this.props;
        // console.log("onSnapTask prop", onSnapTask);
        // console.log("other props", other);
        // console.log("sectionId", sectionId);
        // console.log("rowID", rowID);
        // console.log("task item", item);
        onSnapTask.bind(item);
        let closed = true;
        if (this.props.activeTask == index) {
            closed = false;
        }
        // console.log("index: ", index);
        // console.log("closed: ", closed);
        return (
            <TaskItem
                // other includes 'willStartMove' cb, 'onPressItem' callback, onPressItemCheckBox callback
                {...other}
                isMoving={isMoving}
                data={item}
                id={item.id}
                onSnapTask={this._onSnapTask.bind(this, item, index)}
                closed={closed}
                disabled={this.props.isEditingTasks}
                shouldStartMove={move}
                shouldEndMove={moveEnd}
                // {...sortHandlers}
            />
        );
    };

    _onSnapTask(item, index, rowState) {
        // console.log("onSnapTask in TaskList");
        // console.log("item", item);
        // console.log("index", index);
        // console.log("rowState", rowState);
        this.props.onSnapTask(item, index, rowState);
    }

    render() {
        // console.debug("Render TaskList");
        // console.debug("props: ", this.props);
        let contContainerStyle = styles.contContainerStyleNotEmpty;

        let alarmTasks = this.props.data;
        let filteredAlarmTasks = this.props.hideDisabledTasks
            ? this.props.data.filtered("enabled == true")
            : null;

        let filterMap;
        if (filteredAlarmTasks) {
            filterMap = filteredAlarmTasks.map(aTask => {
                return aTask.order;
            });
            if (filteredAlarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
        } else {
            if (alarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
        }

        // console.log('alarmTasks', alarmTasks);
        // console.log("taskList", this.props.data);
        // console.log("tasksArr in task-list", tasksArr);
        return (
            <TouchableWithoutFeedback
                /* No Styling since TouchableWithoutFeedback just ignores the style prop */
                onPressIn={this.props.closeTaskRows}
            >
                {/* This wrapper view is required for the TouchableWithoutFeedback to work within the TaskArea. */}
                <View
                    style={[
                        {
                            flex: 1,
                            alignContent: "stretch"
                        },
                        this.props.tlContainerStyle
                    ]}
                >
                    <DraggableFlatList
                        data={filteredAlarmTasks || alarmTasks}
                        renderItem={this._renderItem}
                        keyExtractor={this._keyExtractor}
                        // scrollPercent={5}
                        onMoveEnd={moveInfo => {
                            // console.log("'this' now: " + this.constructor.name);
                            // console.log("moveInfo.from", moveInfo.from);
                            // console.log("moveInfo.to", moveInfo.to);
                            // console.log("row", moveInfo.row);
                            // console.log(
                            //     "tasksArr in onRowMoved callback in task-list",
                            //     tasksArr
                            // );
                            this.props.onReorderTasks(
                                alarmTasks,
                                filterMap,
                                moveInfo.data.id,
                                moveInfo.from,
                                moveInfo.to
                            );
                        }}
                        bounces={false}
                        // scrollEnabled={!this.props.isSlidingTask}
                        // scrollEnabled={true}
                        forceRemeasure={this.props.forceRemeasure}
                        containerDimensions={this.props.containerDimensions}
                        contentContainerStyle={contContainerStyle}
                        ListEmptyComponent={
                            <View
                                style={{
                                    alignSelf: "stretch",
                                    alignContent: "stretch",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flex: 1
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: Colors.backgroundBright,
                                        fontFamily: "Gurmukhi MN",
                                        letterSpacing: 0.5
                                    }}
                                >
                                    No tasks yet...
                                </Text>
                            </View>
                        }
                        getItemLayout={(data, index) => {
                            return {
                                length: 55,
                                offset: 55 * index,
                                index
                            };
                        }}
                    />
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    contContainerStyleEmpty: {
        flexGrow: 1,
        justifyContent: "center"
    },
    contContainerStyleNotEmpty: {
        flexGrow: 1
    }
});

export default TaskList;
