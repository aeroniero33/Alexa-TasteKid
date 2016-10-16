# Alexa integration for tastekid

To make the zip just

    npm run zip

And upload it to lambda.

# Intents

- `AddReferenceMovie` Add more reference.
- `GetReferences` Ask what movies we have so far.
- `RemoveReferenceMovie` Remove movies (scratch {movie}/forget about
  {movie}/forget {movie}).
- `ResetReferenceMovies` Reset (forget everything/let's start again)
- `RemoveLastReference` Remove last movie (scratch that)
- `RepeatSuggestions` Repeat movies (come again)
- `EndSession` End session (thanks/that's it/that would be it)

# Setup Alexa Voice Service at developers.amazon.com
## Skill Information
- Name: MovieBlend
- Invocation Name: movie blend

# Interaction Model
- Intent Schemas: [Source](schema/intents.json)
- Custom Slot Types: Type: Movies - [Values](schemas/custom_slot_types.txt)
- Sample Utterances: [Source](schema/utterences.txt)

# Configuration
- Endpoint Type: AWS Lambda ARN (Amazon Resource Name) | North America
- ARN: Your custom ARN lambda function
