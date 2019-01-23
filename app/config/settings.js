import realm from "../data/DataSchemas";

let settings = realm.objects("Setting");

let accessor = {};

accessor.recCooldown = newVal => {
    let setting = settings.filtered("name = 'recCooldown'")[0];
    if (newVal != null) {
        realm.write(() => {
            setting.value = newVal;
        });
    }
    console.log("fetching setting recCooldown");
    return setting.value;
};

accessor.maxRecs = newVal => {
    console.log("fetching setting maxRecs");
    let setting = settings.filtered("name = 'maxRecordings'")[0];
    if (newVal != null) {
        realm.write(() => {
            setting.value = newVal;
        });
    }
    return setting.value;
};

export default accessor;
