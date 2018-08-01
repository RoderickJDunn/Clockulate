import json
from pprint import pprint

preshifted = None
with open("app/img/off-to-clock-lottie.json", "r") as f:
    preshifted = json.load(f)

# print(preshifted)

y_positional_paths = [["layers", "ks", "a", "k"], ["layers", "ks", "p", "y", "k"]]