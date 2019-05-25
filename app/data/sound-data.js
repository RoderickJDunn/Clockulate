import { SOUND_TYPES } from "./constants";

let SOUND_DATA = [
    {
        files: [],
        displayName: "Vibrate Only",
        category: "",
        order: 0,
        enabled: false,
        type: SOUND_TYPES.SILENT
    },
    {
        files: ["tone1_cloudwalk_30s.mp3", "tone1_cloudwalk_full.mp3"],
        displayName: "Cloud Walk",
        category: "",
        order: 1,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone3_skyride_30s.mp3", "tone3_skyride_full.mp3"],
        displayName: "Sky Ride",
        category: "",
        order: 3,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone5_brightandearly.mp3"],
        displayName: "Bright and Early",
        category: "",
        order: 4,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone6_childishbells_30s.mp3"],
        displayName: "Childish Bells",
        category: "",
        order: 5,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone8_theslinky_30s.mp3"],
        displayName: "The Slinky",
        category: "",
        order: 7,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone9_lookalive_30s.mp3"],
        displayName: "Look Alive",
        category: "",
        order: 8,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone11_hauntedsunrise.mp3"],
        displayName: "Haunted Sunrise",
        category: "",
        order: 11,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone12_raysoflight.mp3"],
        displayName: "Rays of Light",
        category: "",
        order: 12,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["age_of_innovation_30s.mp3", "age_of_innovation.mp3"],
        displayName: "Age of Innovation",
        category: "",
        order: 18,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["tone01_digital1.mp3"],
        displayName: "Digital Alarm 1",
        category: "",
        order: 13,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone02_digital2.mp3"],
        displayName: "Digital Alarm 2",
        category: "",
        order: 14,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone03_digital3.mp3"],
        displayName: "Digital Alarm 3",
        category: "",
        order: 15,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone04_digital4.mp3"],
        displayName: "Digital Alarm 4",
        category: "",
        order: 16,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone100_edmsiren.mp3"],
        displayName: "EDM Siren ( loud! )",
        category: "",
        order: 17,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },

    /* Premium Sounds */
    {
        files: ["dawn_of_time_30s.mp3", "dawn_of_time.mp3"],
        displayName: "Dawn of Time",
        isPremium: true,
        category: "",
        order: 20,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["drifting_away_30s.mp3", "drifting_away.mp3"],
        displayName: "Drifting Away",
        isPremium: true,
        category: "",
        order: 21,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["tone7_epicbliss_30s.mp3", "tone7_epicbliss_full.mp3"],
        displayName: "Epic Bliss",
        isPremium: true,
        category: "",
        order: 6,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["positive_motivation_30s.mp3", "positive_motivation.mp3"],
        displayName: "Positive Motivation",
        isPremium: true,
        category: "",
        order: 24,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["serenity_30s.mp3", "serenity.mp3"],
        displayName: "Serenity",
        isPremium: true,
        category: "",
        order: 25,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["successful_motivation_30s.mp3", "successful_motivation.mp3"],
        displayName: "True Motivation",
        isPremium: true,
        category: "",
        order: 26,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["thinking_time_30s.mp3", "thinking_time.mp3"],
        displayName: "Thinking Time",
        isPremium: true,
        category: "",
        order: 27,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["first_steps_30s.mp3", "first_steps.mp3"],
        displayName: "First Steps",
        isPremium: true,
        category: "",
        order: 22,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["bright_ideas_30s.mp3", "bright_ideas.mp3"],
        displayName: "Bright Ideas",
        isPremium: true,
        category: "",
        order: 19,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["tone2_walkwithme_30s.mp3", "tone2_walkwithme_full.mp3"],
        displayName: "Walk With Me",
        isPremium: true,
        category: "",
        order: 2,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["happy_instrumental_30s.mp3", "happy_instrumental.mp3"],
        displayName: "Happy Instrumental",
        isPremium: true,
        category: "",
        order: 23,
        enabled: false,
        type: SOUND_TYPES.NORMAL,
        source: "Purple Planet"
    },
    {
        files: ["tone95_lookalive_30s.mp3"],
        displayName: "Look More Alive",
        isPremium: true,
        category: "",
        order: 9,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: ["tone10_bounceouttabed.mp3"],
        displayName: "Bounce Outta Bed",
        isPremium: true,
        category: "",
        order: 10,
        enabled: false,
        type: SOUND_TYPES.NORMAL
    },
    {
        files: [],
        displayName: "Random",
        category: "",
        order: 28,
        enabled: false,
        type: SOUND_TYPES.RANDOM
    }
];

export default SOUND_DATA;
