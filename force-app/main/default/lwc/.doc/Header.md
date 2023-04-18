# Header

Består av 6 "hoveddeler"

1. Fnr (og bilde av kjønn)
2. Alder / Nasjonalitet / Sivilstand
3. NAV enhet
4. Oppfølgende veilder (hvis den finnes)
5. Badgene våre
6. Historiske fullmakter (mappe)

## Badgene

Forteller alt det er å vite om de forskjellige badgene våre
All logikken for å hente ut badgene finnes i NKS_PersonBadgesController, og visningen av de håndteres i lwc-komponenten nksPersonBadges

### Sikkerhetstiltak

Forteller om brukeren er "plagsom" og derfor under spesifikke tiltak som gjør at de må behandles på en spesiell måte. Et eksempel kan være å ikke ha lovt med fysisk møte på NAV-kontor med mindre det er to veildere i rommet.
Fylles ut av feltet INT_SecurityMeasures\_\_c feltet, som settes av PDL automatisk
eks:

```
[
  {
    "tiltaksType": "FTUS",
    "kontaktPersonId": "Z133394",
    "kontaktPersonEnhet": "0101",
    "gyldigTilOgMed": "2023-05-31",
    "gyldigFraOgMed": "2022-04-04",
    "beskrivelse": "Fysisk/telefonisk utestengelse"
  }
]
```

### Død

Badge om personen er død, fylles ut av feltet INT_IsDeceased\_\_c, som settes av PDL automatisk

### PowerOfAttorney/Fullmakt

Viser alle fullmaktene til en person. Fullmakt gir en person full makt over å gjøre avgjørelser for en annen person. Settes av feltet INT_PowerOfAttorney\_\_c som settes av PDL automatisk ved last
Eks:

```
[
  {
    "omraader": ["*"],
    "omraade": "Gjelder alle ytelser",
    "motpartsRolle": "Fullmektig",
    "motpartsPersonident": "01234567890",
    "motpartsNavn": null,
    "id": null,
    "gyldigTilOgMed": "2023-12-09",
    "gyldigFraOgMed": "2022-12-08"
  },
  {
    "omraader": ["PEN", "DAG"],
    "omraade": "PEN,DAG",
    "motpartsRolle": "Fullmektig",
    "motpartsPersonident": "01234567890",
    "motpartsNavn": null,
    "id": null,
    "gyldigTilOgMed": "2022-12-09",
    "gyldigFraOgMed": "2022-12-08"
  }
]
```

### Guardianship/FuturePowerOfAttorney

Vergemål: Når en person ikke er i stand til å ivareta sine interesser selv kan en verge oppnevnes. Det er frivillig, og vergen tar for seg gjøremål som for eksempel orden på økonomi, betaling av regninger, søknader osv. Det finnes også noe som heter Tvunget vergemål, og det da er personen fratatt rettslig handleevne. (de er umyndiggjort)
Settes av feltet INT_GuardianshipOrFuturePowerOfAttorney\_\_c\_\_c som hentes inn fra PDL automatisk på last
Eks:

```
[
  {
    "type": "midlertidigForVoksen",
    "omfangetErInnenPersonligOmraade": true,
    "omfang": "personligeOgOekonomiskeInteresser",
    "navn": {
      "fornavn": "Motpart",
      "mellomnavn": "Old Name",
      "etternavn": "Motpartsen"
    },
    "motpartsPersonident": "01234567890",
    "embete": "Fylkesmannen i Rogaland"
  }
]
```

### Spoken language intepreter

Det er behov for en språktolk for å garantere at de forstår veiledningene.
Settes av feltet INT_SpokenLanguageIntepreter\_\_c
Eks:

```
HR;SV
```

Disse kodene er mappet til common code records med CRM_Code_set\_\_c='Språk' ved hjelp av CRM_Code\_\_c feltet på common code.

### KRR reservert

Forteller om en person er reservert for digital kommunikasjon i Kontakt og reservasjonsregisteret , er en boolean verdi i feltet INT_KRR_Reservation\_\_c

### Åpne STOer

Denne badgen vises bare på Case record pager. Den aggregerer alle STO henvendelsene som er åpne (ubesvart, ikke lukket og ikke under behandling) og grupperer det på tema.

### Ubrukte badger

Det finnes også to badge typer som vi ikke viser, VisualAndHearingImpairment og Entitlements. Begge disse kommer fra DigiHOT (digital hjelpemidler) teamet.
VisualAndHearingImpairment forteller om brukeren er døv, tunghørt eller blind etc. og hvilket paragraf de tilhører.
Entitlement er vi ikke helt sikker på 😅

## Historiske fullmakter

Historiske fullmakter er i bunn og grunn fullmakter som ikke er gyldige lenger.
Logikken for å hente dette ligger i NKS_HistorikkViewController, mens visningen håndteres i lwc-kompoentne nksPersonHeader

Denne dataen hentes direkte fra PDL ved api, da henter vi ut alle digitale fullmakter som har flagget historisk tikket på.
