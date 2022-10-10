# crm-nks-base-components

[![Build](https://github.com/navikt/crm-shared-template/workflows/%5BPUSH%5D%20Create%20Package/badge.svg)](https://github.com/navikt/crm-shared-template/actions?query=workflow%3Acreate)
[![GitHub version](https://badgen.net/github/release/navikt/crm-nks-base-components/stable)](https://github.com/navikt/crm-nks-base-components)
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/navikt/crm-shared-template/blob/master/LICENSE)

Dette er en samling komponenter som i all hovedsak benyttes av [crm-nks-base](https://github.com/navikt/crm-nks-base)

## Avhengigheter

Denne pakken er avhengig av følgende pakker

-   [crm-platform-base](https://github.com/navikt/crm-platform-base)
-   [crm-platform-integration](https://github.com/navikt/crm-platform-integration)

## Installasjon

1. Installer [npm](https://nodejs.org/en/download/)
1. Installer [Salesforce DX CLI](https://developer.salesforce.com/tools/sfdxcli): `npm install sfdx-cli --global`
1. Klon dette repoet ([GitHub Desktop](https://desktop.github.com) for ikke utviklere)
1. Kjør `npm install` fra prosjekt roten
1. Installer [SSDX](https://github.com/navikt/ssdx)
    - **Ikke utviklere kan stoppe etter dette steget**
1. Installer [VS Code](https://code.visualstudio.com) (anbefalt)
    - Installer [Salesforce Extension Pack](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)
    - **Installer anbefalte plugins!** En notifikasjon burde dukke opp når man åpner VS Code. Den vil liste opp pluginsene.
1. Installer Java JDK versjon 8 eller 11 (f.eks [AdoptOpenJDK](https://adoptopenjdk.net))
1. Åpne VS Code settings og søk etter `salesforcedx-vscode-apex`
1. Under `Java Home`, legg til path til den JDK versjonen du installerte. F.eks:
    - macOS: `/Library/Java/JavaVirtualMachines/adoptopenjdk-[VERSION_NUMBER].jdk/Contents/Home`
    - Windows: `C:\\Program Files\\AdoptOpenJDK\\jdk-[VERSION_NUMBER]-hotspot`

## Bygge Scratch Org

For å bygge lokalt uten å bruke SSDX så kan man gjøre følgende:

1. Sjekk om du er koblet til DevHub'en(Produksjon) med en DX bruker, hvis ikke kjør `sfdx auth:web:login -d -a production` og logg inn.
    - Kontakt `#crm-platform-team` på Slack dersom du ikke har en bruker.
    - Hvis du veksler fra et repo til et annet så kan du endre DevHub brukernavnet her: `.sfdx/sfdx-config.json`, evt. kjøre kommandoen nevnt over.
1. Opprett en scratch org, installer avhengigheter og push metadata:

```bash
key=<PACKAGE KEY>

sfdx force:org:create -f ./config/project-scratch-def.json --setalias scratch_org --durationdays 1 --setdefaultusername

echo y | sfdx plugins:install sfpowerkit@2.0.1

keys="" && for p in $(sfdx force:package:list --json | jq '.result | .[].Name' -r); do keys+=$p":${key}"; done

sfdx sfpowerkit:package:dependencies:install -u scratch_org -r -a -w 60 -k ${keys}

sfdx force:source:push

sfdx force:data:tree:import -p dummy-data/baseData/plan.json

sfdx force:org:open
```

## Utvikling

For å skru på debug mode og mocks for testing/debuggig av LWC komponentene så er det lagt inn scripts i `package.json`.

Dersom man kjører `npm run scratch:postCreate` så settes debug mode, mock skrus på og det kjøres et skript som justerer testdata.

TypeScript linting er konfigurert i `force-app\main\default\lwc\jsconfig.json`, SAF spesifikke typer ligger i `saf.d.ts`

# Henvendelser

Enten:
Spørsmål knyttet til koden eller prosjektet kan stilles som issues her på GitHub

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #crm-nks eller #crm-platform-team
