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
    console.log("fetching setting recCooldown blah");
    return setting.value;
};

accessor.maxLogs = newVal => {
    console.log("fetching setting maxLogs blah");
    let setting = settings.filtered("name = 'maxLogs'")[0];
    if (newVal != null) {
        realm.write(() => {
            setting.value = newVal;
        });
    }
    return setting.value;
};

export default accessor;
