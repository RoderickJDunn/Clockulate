# Script for extracting 3rd party libraries into meta-data file

import json
import sys
import subprocess
import re

packages_file = "./package.json"
file_txt = ""
file_json = None

# KEYS_TO_EXTRACT = [["repository", "url"], "license"]


def err_exit(msg):
    print("FATAL: " + msg)


def get_json_item(json, key):
    try:
        # print("     " + str(json[key]))
        return json[key]
    except:
        # print("     Unknown " + key)
        return ""


with open(packages_file, "r") as f:
    # file_txt = f.read()
    file_json = json.load(f)

if not file_json:
    err_exit("Fail")
    sys.exit()

dependencies = file_json["dependencies"]

output = []

for name, version in dependencies.items():
    if not version[0].isdigit():
        version = version[1:]
    print(name)
    # print("     " + version)

    npm_info = subprocess.check_output(["npm", "info", name, "--json"])

    item = {}

    if npm_info:
        info_json = json.loads(npm_info.strip())

        name_fmt = re.sub(r'[^\w]', ' ', name).strip().title()
        # name_fmt = name.replace("-", " ").title()
        item["name"] = name_fmt

        repo_info = get_json_item(info_json, "repository")
        if repo_info:
            item["repository"] = get_json_item(repo_info, "url")
        else:
            item["repository"] = ""

        item["license"] = get_json_item(info_json, "license")
        item["author"] = get_json_item(info_json, "author")
        item["year"] = "01234566899"
        try:
            curr_vers_date = info_json["time"]["created"]
            year = curr_vers_date[:4]
            item["year"] = year
        except:
            print("failed to get year for package " + name)

        if not item["author"]:
            if name in ["react-native", "react"]:
                item["author"] = "Facebook, Inc. and its affiliates."

    output.append(item)

# print(output)

# add FDSoundActivatedRecorder manually
fd_item = {"name": "FDSoundActivatedRecorder", "year": "2013", "license": "MIT",
           "repository": "https://github.com/fulldecent/FDSoundActivatedRecorder", "author": "William Entriken"}

output.append(fd_item)

with open("attr_metadata.json", "w+") as f:
    json.dump(output, f)
