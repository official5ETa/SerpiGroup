# scrape.py {api_id} {api_hash} {phone} {from_group} {final_group}

import os
import re
import sys
import time
import random
import json

from telethon.sync import TelegramClient
from telethon.errors.rpcerrorlist import PeerFloodError, UserPrivacyRestrictedError
from telethon.tl.functions.channels import InviteToChannelRequest
from telethon.tl.types import InputPeerChannel, UserStatusOnline, UserStatusRecently, UserProfilePhoto

user_already_added_file = './shared/userAlreadyAdded.txt'
excepted_user_strings_file = './shared/exceptedUserStrings.txt'


def print_data(code, data=None):
    print(json.dumps({'code': code, 'data': data}))


def string_in_array(string, string_array):
    for s in string_array:
        if s in string:
            return True
    return False


def create_user_already_added_file():
    try:
        if not os.path.exists(user_already_added_file):
            with open(user_already_added_file, "w"):
                pass
            print_data('CREATED_USERALREADYADDED')
    except:
        print_data('ERROR', 'COULD_NOT_OPEN_USERALREADYADDED')
        exit(1)


create_user_already_added_file()


try:
    with open(excepted_user_strings_file, 'r+') as file:
        exceptedUserStrings = [exceptedUserString.strip() for exceptedUserString in file.readlines() if exceptedUserString.strip() != ""]
        if not exceptedUserStrings:
            file.write('')
            print_data('CREATED_EXCEPTEDUSERSTRINGS')
except:
    print_data('ERROR', 'COULD_NOT_OPEN_EXCEPTEDUSERSTRINGS')
    exit(1)


client = TelegramClient(f"./shared/{sys.argv[3]}", int(sys.argv[1]), sys.argv[2])
client.connect()


time.sleep(1)
from_group = client.get_entity(int(sys.argv[4]))
print_data('FROM_GROUP_TITLE', from_group.title)

time.sleep(1)
final_group = client.get_entity(int(sys.argv[5]))
time.sleep(1)
final_group_entity = InputPeerChannel(final_group.id, final_group.access_hash)

time.sleep(1)
users = client.get_participants(from_group, aggressive=True)
random.shuffle(users)


for user in users:
    if not user.is_self and not user.bot and not user.fake and not user.support and not user.deleted and not isinstance(user.photo, UserProfilePhoto):
        if user.username and re.search(r'[^a-zA-Z0-9äöüÄÖÜß]', str(user.first_name).lower()) is None and re.search(r'[^a-zA-Z0-9äöüÄÖÜß]', str(user.last_name).lower()) is None:
            if not string_in_array(user.username.lower(), exceptedUserStrings) and not string_in_array(user.first_name.lower(), exceptedUserStrings):
                if isinstance(user.status, UserStatusOnline) or isinstance(user.status, UserStatusRecently):

                    try:
                        with open(user_already_added_file, 'r+') as file:
                            alreadyAddedUsers = [alreadyAddedUser.strip() for alreadyAddedUser in file.readlines() if alreadyAddedUser.strip() != ""]

                            if user.username in alreadyAddedUsers:
                                time.sleep(.2)

                            else:
                                try:
                                    user_to_add = client.get_input_entity(user.username)
                                    client(InviteToChannelRequest(final_group_entity, [user_to_add]))
                                    file.write('\n' + user.username)

                                    print_data('ADD_USER', {
                                        'username': user.username,
                                        'firstname': user.first_name,
                                        'lastname': user.last_name
                                    })
                                    time.sleep(random.randrange(40, 60))

                                except PeerFloodError:
                                    print_data('ERROR', 'USERADD_FLOOD')
                                    time.sleep(random.randrange(1800, 5400))

                                except UserPrivacyRestrictedError:
                                    file.write('\n' + user.username)
                                    print_data('ERROR', 'USERADD_PRIVACY')
                                    time.sleep(random.randrange(10, 20))

                                except:
                                    file.write('\n' + user.username)
                                    print_data('ERROR', 'USERADD_UNKNOWN')
                                    time.sleep(random.randrange(10, 20))

                    except FileNotFoundError:
                        print_data('ERROR', 'COULD_NOT_FIND_USERALREADYADDED')
                        create_user_already_added_file()
                        time.sleep(1)

                    except:
                        print_data('ERROR', 'COULD_NOT_OPEN_USERALREADYADDED')
                        time.sleep(10)
                        create_user_already_added_file()
                        time.sleep(1)
