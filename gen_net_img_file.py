import sys
from os import listdir
from os.path import isfile, join

RAW_IMAGES = []
IMG_BASE_NAMES = []

def enumerateImages(path):
    global RAW_IMAGES
    global IMG_BASE_NAMES

    RAW_IMAGES = [f for f in listdir(path) if isfile(join(path, f))]

    for img in RAW_IMAGES: 
        if img.startswith("."): continue
        IMG_BASE_NAMES.append(img.split("@")[0])

if len(sys.argv) < 2:
    print("Image directory required")
    sys.exit()


enumerateImages(sys.argv[1])

# IMAGES = ["AlarmItem_final_step0", "AlarmItem_final_step1", "AlarmItem_final_step2", "AlarmItem_final_step3", "AlarmItem_final_step4", "AlarmDetail_final_step1", "AlarmDetail_final_step2", "AlarmDetail_final_step3", "AlarmDetail_final_step4", "ADTasks_final_step1",
#           "ADTasks_final_step2", "ADTasks_final_step3", "ADTasks_final_step4", "ADModes_final_step1", "ADModes_final_step2"
#           ]

DENISTIES = [1, 1.5, 2, 3, 3.5]
start = "const NET_IMAGES = { "
end = """ }; 
export default NET_IMAGES;
"""

ext = ".png"

densities_template = ""
for d in DENISTIES:
    densities_template += "{}: {{}}, ".format(d)

full_text = start

for img in IMG_BASE_NAMES:
    content = densities_template.format('"' + img + "%401x" + ext + '"',
                                        '"' + img + "%401x" + ext + '"',
                                        '"' + img + "%402x" + ext + '"',
                                        '"' + img + "%403x" + ext + '"',
                                        '"' + img + "%403x" + ext + '"'
                                        )

    text = "{}: {{{}}},".format(img, content)
    full_text += text

full_text += end

print(full_text)

with open("app/img/network_images.js", "w") as f:
    f.write(full_text)
