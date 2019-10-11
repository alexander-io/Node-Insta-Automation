![sample 00](sample_output_images/00.png)
![sample 01](sample_output_images/01.png)

Linux 4.15.0-50-generic #54~16.04.1-Ubuntu SMP Wed May 8 15:55:19 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux\

Architecture:          x86_64\
CPU op-mode(s):        32-bit, 64-bit\
Byte Order:            Little Endian\
CPU(s):                8\
On-line CPU(s) list:   0-7\
Thread(s) per core:    2\
Core(s) per socket:    4\
Socket(s):             1\
NUMA node(s):          1\
Vendor ID:             GenuineIntel\
CPU family:            6\
Model:                 158\
Model name:            Intel(R) Core(TM) i7-7700HQ CPU @ 2.80GHz\
Stepping:              9\
CPU MHz:               900.018\
CPU max MHz:           3800.0000\
CPU min MHz:           800.0000\
BogoMIPS:              5616.00\
Virtualization:        VT-x\
L1d cache:             32K\
L1i cache:             32K\
L2 cache:              256K\
L3 cache:              6144K\
NUMA node0 CPU(s):     0-7\


## installation
```bash
# ensure nodejs is  installed
node --version
# ensure npm is installed
npm --version
# ensure git is installed
git --version
# ensure streamer is installed
sudo apt install streamer -y
# clone project repository
git clone https://github.com/alexander-io/Node-Insta-Automation.git
# move to project directory
cd Node-Insta-Automation
# install npm packages
npm install
# create a list of users
echo "alxndr.fpv" > lists/my_list_of_users
# run script
# running the script takes 4 command line arguments
# <username>, instagram account username
# <pw>, instagram account password
# <path_to_list_of_users>, usually contained in lists/ directory
# <time_between_posts_ms>, the amount of time in milliseconds between  posts
node xx.js <username> <pw> <path_to_list_of_users> <time_between_posts_ms>
# the routine will begin aggregating data, storing image data, and scheduling posts
```

Within lists/ directory make a file (list_of_users) containing all of the usernames that you wish to aggregate content from

The usernames should be newline separated, ex :

first_username\
second_username\
...\
etc
