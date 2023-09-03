# Hypixel Skyblock Tracker

Keep track of your progress so you can view it later on.
Currently only targetted towards my own profile.

## Usage

To run the Hypixel Skyblock Tracker, use the following command:

```
node . <command>
```

### Available Commands

- `stats`: Grabs your stats from the API and saves them locally. (run once)
- `lvl`: Calculate a skill level based on total xp.
- `nextlvl`: Based on your latest save, tells you how much xp you need to reach a certain skill level. You may provide your xp per hour rate, and it'll estimate how long it will take you.
- `compare`: Compares your progress from your latest save to a specified date. Uses the previous save if no date is provided (yyyy-mm-dd format).

## Usages

- `node . lvl <xp>`
- `node . nextlvl <skill> <?lvl> <?xp per hour>`
- `node . compare <yyyy-mm-dd>`

### Other

- `refilter`: Used to refilter data if something new is added.

## Extra Utility

- `node chart`: Chart your data with all your saves to see progress over time, while running open localhost:3000 (or set a port in the config)
- `node talismans`: Display stats about your accessory bag, using data from your recent save.
