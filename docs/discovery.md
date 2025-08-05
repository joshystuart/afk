# Remote Claude Code Service - Discovery
> Read over the discovery.md document to understand the project and its phases. We have already completed the MVP 
> phase (which you can see the code in the "./docker" directory). We are now working on the next phases of the 
> project. I want you to create a "docs/1 - phase 1" directory and create a "phase-1_plan.md" file in that directory.
> Create a plan for the phase 1 of the project based on the information in this document. The plan should be broken 
> down into several steps, each with a clear description of what needs to be done. Use the appropriate subagent.

## Project Overview
AFK is a remote Claude Code service that launches Docker containers with dual terminal sessions (Claude + manual access), automatic git integration, web-based terminal access, and web based ability to launch new sessions.

## Features
* Launch docker containers with dual terminal sessions (Claude + manual access) from a web interface
* Automatically checkout git repositories and start a claude session
* Configurable git repository URL, ssh key and branch for each session
* Web-based terminal access to the claude session
* Web-based ability to launch new sessions / docker containers

## Phases

### Phase 0 - MVP

We created a docker/Dockerfile that builds a docker image with ttyd and claude with the appropriate configuration to 
run the claude session in a web terminal. We also created a docker/docker-compose.yml file that allows us to launch the 
docker container with the appropriate environment variables.

### Phase 1 - Git Integration

We will update the Dockerfile to include git and create a script that will automatically checkout the git 
repository and ssh key and start the claude session. We will also update the docker-compose.yml file to include the git 
repository URL, ssh key and branch as environment variables.

### Phase 2 - Server and Web Interface
We will create a nestjs server and web interface that allows users to launch new sessions and view existing 
sessions. The server use the docker API to launch new containers and manage existing ones, and the UI will call the 
server via a RESTful API.

The UI will show a list of existing sessions, allow users to launch new sessions, and provide links to the web-based 
terminal for each session. The UI will also allow users to configure the git repository URL, ssh key and branch for 
each session before launching it.

### Phase 3 - Production Infrastructure

We will need to set up a production infrastructure to run the AFK service in AWS. We may need to use ECS or EKS to manage
the containers and ensure they are running in a production environment. We should use CDK typescript to define the infrastructure as code. 

We will then need to refactor our application to use the production infrastructure and ensure it is scalable and reliable.
