I want to be able to select different docker images to launch a session with. The idea is that users may want to have a python or c# or kotlin session, but right now it is fixed to a nodejs image.

This means we need to create a base image that has everything we need to make AFK work eg. tmux/ttyd, git, file watching etc.

Then we extend that base image to install a sepecific set of lanaguages and tools that we need. We then allow a user to maintain a set of images via the settings eg.

- Name: Python
- Image: myafkimage/python

And then in the session window they can choose from a dropdown the image they want to launch with.

So lets use this opportunity to:
- clean up all the scripts in docker/scripts as some aren't required, some are