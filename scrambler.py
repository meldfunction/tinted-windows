#!/usr/bin/env python3
"""
pane scrambler — alias seed generator
======================================
Generates random word-pair seeds from a built-in word list.
Use these as the basis for your alias identities.

Each word pair becomes:
  - Your alias name prefix   → maple-circuit
  - Your alias email         → maple-circuit-7x2@your.alias.domain
  - Your context label       → maple-circuit (used in pane commands)

Usage:
  python3 scrambler.py              # generate 10 word-pair seeds
  python3 scrambler.py --count 5    # generate 5
  python3 scrambler.py --export     # write to alias-seeds.txt

NEVER reuse a seed across different real-world services.
Each service you sign up for gets its own unique seed.
"""

import random
import argparse
import sys
from pathlib import Path

# ── WORD LIST ─────────────────────────────────────────────────────────────────
# Chosen for: distinct pronunciation, unambiguous spelling, no PII associations.
# Two pools — adjectives + nouns — combined for memorability without meaning.

ADJECTIVES = [
    "amber","arctic","aspen","birch","blaze","bolt","cedar","chalk","cinder",
    "cobalt","copper","coral","crimson","dawn","delta","dusk","echo","ember",
    "fern","flint","forge","frost","glint","grove","hazel","heather","hollow",
    "indigo","inlet","ivory","jade","jasper","kestrel","larch","laurel","linen",
    "lunar","maple","marsh","mist","navy","nimbus","ochre","opal","orbit","otter",
    "petal","pine","prism","quartz","raven","ridge","river","rowan","runic",
    "sable","sage","salt","sand","scout","shale","slate","smoke","solar","sparrow",
    "spruce","starling","storm","summit","swift","tallow","teal","thistle","timber",
    "trace","tundra","vale","vault","veldt","wick","willow","wren","zephyr","zenith"
]

NOUNS = [
    "anvil","arch","basin","beacon","bridge","brook","cable","cairn","canal",
    "canopy","cast","chord","circuit","cistern","cleft","crest","current","depth",
    "dial","drift","dune","echo","edge","ember","falls","field","flare","frame",
    "gate","glade","gorge","grid","gully","haven","hearth","helm","hollow","kelp",
    "knot","latch","ledge","lens","lever","light","line","link","loch","lock",
    "loop","lore","mark","mast","meld","mesh","mill","moor","node","notch",
    "orbit","pass","patch","peak","pier","pillar","pitch","plain","plank","pool",
    "port","post","press","range","rapid","reach","reef","relay","ridge","rift",
    "rivet","root","route","rune","seal","shaft","shore","sill","sluice","span",
    "spoke","stack","stake","stave","stern","strand","strut","surge","sweep",
    "tide","tine","torch","track","trail","vault","vein","weir","well","wharf"
]

def generate_seed(rng=None):
    if rng is None:
        rng = random.SystemRandom()
    adj  = rng.choice(ADJECTIVES)
    noun = rng.choice(NOUNS)
    return f"{adj}-{noun}"

def generate_seeds(count=10):
    rng   = random.SystemRandom()
    seeds = set()
    while len(seeds) < count:
        seeds.add(generate_seed(rng))
    return sorted(seeds, key=lambda x: random.random())[:count]

def main():
    parser = argparse.ArgumentParser(description="pane alias seed generator")
    parser.add_argument("--count",  type=int, default=10, help="Number of seeds to generate (default: 10)")
    parser.add_argument("--export", action="store_true",  help="Write seeds to alias-seeds.txt")
    args = parser.parse_args()

    seeds = generate_seeds(args.count)

    print("\n  pane scrambler — alias seeds\n")
    print("  Use one seed per service. Never reuse.\n")
    print(f"  {'SEED':<28} {'ALIAS EMAIL EXAMPLE':<48} {'COMMAND'}")
    print(f"  {'─'*28} {'─'*48} {'─'*28}")
    for s in seeds:
        short_hash = format(abs(hash(s)) % 0xFFF, 'x')
        alias_ex   = f"{s}-{short_hash}@alias.yourdomain.com"
        cmd        = f"pane enroll <url> --context {s}"
        print(f"  {s:<28} {alias_ex:<48} {cmd}")

    print(f"\n  {len(seeds)} seeds generated using SystemRandom (OS entropy)\n")

    if args.export:
        out = Path("alias-seeds.txt")
        out.write_text("\n".join(seeds) + "\n")
        print(f"  Written to {out.resolve()}\n")
        print("  ⚠  Keep this file private. Delete it when done. Never commit it.\n")

if __name__ == "__main__":
    main()
