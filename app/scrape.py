# scrape.py {api_id} {api_hash} {phone} {from_group} {final_group} {bot_id}

import os
import re
import sys
import time
import random
import traceback

from telethon.sync import TelegramClient
from telethon.errors.rpcerrorlist import PeerFloodError, UserPrivacyRestrictedError
from telethon.tl.functions.channels import InviteToChannelRequest
from telethon.tl.types import InputPeerChannel


def string_in_array(string, string_array):
    for s in string_array:
        if s in string:
            return True
    return False


def add_user(_user, _final_group_entity):
    user_to_add = client.get_input_entity(_user.username)
    print(f"Adding: {_user.username}")
    client(InviteToChannelRequest(_final_group_entity, [user_to_add]))


try:
    if not os.path.exists('./volume/userAlreadyAdded.txt'):
        with open('./volume/userAlreadyAdded.txt', "w") as file:
            file.write("")
        print("created 'userAlreadyAdded.txt'")
except Exception as e:
    print(f"[!] could not create 'userAlreadyAdded.txt: {e}")
    exit(1)

try:
    if not os.path.exists('./volume/exceptedUserStrings.txt'):
        with open('./volume/exceptedUserStrings.txt', "w") as file:
            file.write("")
        print("created 'exceptedUserStrings.txt'")
except Exception as e:
    print(f"[!] could not create 'exceptedUserStrings.txt: {e}")
    exit(1)

try:
    with open('./volume/exceptedUserStrings.txt', 'r') as file:
        excludedUserStrings = file.readlines()
        excludedUserStrings = [excludedUserStrings.strip() for excludedUserStrings in excludedUserStrings]
except FileNotFoundError as e:
    print("[!] could not find excludedUserStrings.txt")
    exit(1)
except Exception as e:
    print(f"[!] error while reading excludedUserStrings.txt: {e}")
    exit(1)

client = TelegramClient('./volume/' + sys.argv[3], int(sys.argv[1]), sys.argv[2])

client.connect()

if not client.is_user_authorized():
    print("[!] authorization required!")
    sys.exit(1)

time.sleep(1)
from_group = client.get_entity(int(sys.argv[4]))

time.sleep(1)
final_group = client.get_entity(int(sys.argv[5]))
time.sleep(1)
final_group_entity = InputPeerChannel(final_group.id, final_group.access_hash)

time.sleep(1)
users = client.get_participants(from_group, aggressive=True)

for user in users:
    try:
        if not user.is_self and not user.bot and not user.fake and not user.support and user.id != int(sys.argv[6]):
            if user.username and re.search(r'[^a-zA-Z0-9äöüÄÖÜß]', str(user.first_name).lower()) is None and re.search(r'[^a-zA-Z0-9äöüÄÖÜß]', str(user.last_name).lower()) is None:
                if not string_in_array(user.username.lower(), excludedUserStrings) and not string_in_array(user.first_name.lower(), excludedUserStrings):

                    try:
                        with open('./volume/userAlreadyAdded.txt', 'r') as file:
                            alreadyAddedUsers = file.readlines()
                            alreadyAddedUsers = [alreadyAddedUsers.strip() for alreadyAddedUsers in alreadyAddedUsers]
                            alreadyAddedUsers = [alreadyAddedUser for alreadyAddedUser in alreadyAddedUsers if alreadyAddedUser != ""]
                    except FileNotFoundError as e:
                        print("[!] could not find userAlreadyAdded.txt")
                        time.sleep(30)
                        continue
                    except Exception as e:
                        print(f"[!] error while reading userAlreadyAdded.txt: {e}")
                        time.sleep(30)
                        continue

                    if not (user.username in alreadyAddedUsers):
                        try:
                            with open('./volume/userAlreadyAdded.txt', "w") as file:
                                file.write('\n'.join(alreadyAddedUsers) + '\n' + user.username)
                        except Exception as e:
                            print(f"[!] error while writing userAlreadyAdded.txt: {e}")
                            time.sleep(30)
                            continue

                        add_user(user, final_group_entity)
                        time.sleep(random.randrange(30, 60))
                        continue

        time.sleep(.2)

    except PeerFloodError:
        print("[!] Getting Flood Error from telegram. Waiting...")
        time.sleep(3 + 60 + 60)  # 1h
    except UserPrivacyRestrictedError:
        print("[!] The user's privacy settings do not allow you to do this. Skipping.")
        time.sleep(random.randrange(10, 20))
    except:
        traceback.print_exc()
        time.sleep(random.randrange(10, 20))
