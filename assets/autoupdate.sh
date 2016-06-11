#!/bin/bash
# Simple script to update fastd peers from git upstream
# and only send HUP to fastd when changes happend.

# CONFIGURE THIS TO YOUR PEER DIRECTORY
FASTD_PEERS=/home/fastdform/keys
FASTD_BACKBONE=/etc/fastd/ffffng-mesh-vpn/backbone

# CONFIGURE THIS TO THE USER TO RUN THE GIT COMMANDS AS
USER=fastdform

function getCurrentVersion() {
  # Get hash from latest revision
  su -c "git log --format=format:%H -1" $USER
}

cd $FASTD_PEERS

# Get current version hash
GIT_REVISION=$(getCurrentVersion)

# Automagically commit local changes
# This preserves local changes
su -c "git add -A ." $USER
su -c "git commit -m \"CRON: auto commit\"" $USER

# Pull latest changes from upstream
su -c "git fetch" $USER
su -c "git merge origin/master -m \"Auto Merge\"" $USER

# Get new version hash
GIT_NEW_REVISION=$(getCurrentVersion)

# Push changes
su -c "git push" $USER

if [ $GIT_REVISION != $GIT_NEW_REVISION ]
then
  # ATTENTION: Specific handling to sync backbone keys to own directory
  mkdir -p $FASTD_BACKBONE
  rm -f $FASTD_BACKBONE/*
  cp $FASTD_PEERS/srv[0-9][0-9]* $FASTD_PEERS/gateway[0-9][0-9]* $FASTD_BACKBONE/

  # Version has changed we need to update
  echo "Reload fastd peers"
  kill -HUP $(pidof fastd)
fi
