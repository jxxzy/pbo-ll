FROM mcr.microsoft.com/dotnet/sdk:10.0
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 NUGET_PACKAGES=/packages DOTNET_CLI_HOME=/tmp HOME=/tmp
COPY praktikum/ /projects/
RUN for project in /projects/bab-*/*.csproj; do dotnet restore "$project" || exit 1; done && chmod -R a+rX /packages
USER 1654:1654
WORKDIR /work
