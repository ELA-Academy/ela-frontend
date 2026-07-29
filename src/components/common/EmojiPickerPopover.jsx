import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Clock, Smile, Dog, Pizza, Activity, Plane, Lightbulb, Hash, Flag, X } from "lucide-react";

// Comprehensive Emoji Dataset organized into Categories with Search Keywords
export const EMOJI_CATEGORIES = [
  {
    id: "frequently",
    name: "Frequently Used",
    icon: Clock,
    emojis: ["👍", "✅", "🔥", "😊", "🙏", "🙇‍♂️", "😭", "💯", "👀", "🚀", "❤️", "😍", "🎉", "🏼", "😎", "😤", "‼️"]
  },
  {
    id: "smileys",
    name: "Smileys & People",
    icon: Smile,
    emojis: [
      { char: "😀", keywords: "grinning face happy smile" },
      { char: "😃", keywords: "smiley happy face joy" },
      { char: "😄", keywords: "smile happy joy laugh" },
      { char: "😁", keywords: "grin happy teeth" },
      { char: "😆", keywords: "laughing satisfied haha" },
      { char: "😅", keywords: "sweat smile relief" },
      { char: "🤣", keywords: "rofl laughing floor" },
      { char: "😂", keywords: "joy tears laugh cry" },
      { char: "🙂", keywords: "slightly smiling face" },
      { char: "🙃", keywords: "upside down silly" },
      { char: "😉", keywords: "wink flirt" },
      { char: "😊", keywords: "blush proud happy" },
      { char: "😇", keywords: "halo angel innocent" },
      { char: "🥰", keywords: "in love hearts warmth" },
      { char: "😍", keywords: "heart eyes love crush" },
      { char: "🤩", keywords: "star struck excited" },
      { char: "😘", keywords: "kiss blow kiss love" },
      { char: "😗", keywords: "kissing face" },
      { char: "😚", keywords: "kissing closed eyes" },
      { char: "😋", keywords: "yum delicious food" },
      { char: "😛", keywords: "tongue silly playful" },
      { char: "😜", keywords: "wink tongue crazy" },
      { char: "🤪", keywords: "zany goofy wild" },
      { char: "😝", keywords: "squint tongue funny" },
      { char: "🤑", keywords: "money mouth rich" },
      { char: "🤗", keywords: "hug warm embrace" },
      { char: "🤭", keywords: "hand over mouth oops" },
      { char: "🤫", keywords: "shh quiet secret" },
      { char: "🤔", keywords: "thinking ponder hmm" },
      { char: "🤐", keywords: "zipper mouth silent" },
      { char: "🤨", keywords: "raised eyebrow skeptic" },
      { char: "😐", keywords: "neutral face meh" },
      { char: "😑", keywords: "expressionless face" },
      { char: "😶", keywords: "no mouth quiet" },
      { char: "😏", keywords: "smirk sly" },
      { char: "😒", keywords: "unamused bored" },
      { char: "🙄", keywords: "eye roll whatever" },
      { char: "😬", keywords: "grimacing awkward yikes" },
      { char: "🤥", keywords: "lying pinocchio lie" },
      { char: "😌", keywords: "relieved phew calm" },
      { char: "😔", keywords: "pensive sad thoughtful" },
      { char: "😪", keywords: "sleepy tired" },
      { char: "🤤", keywords: "drooling hungry crave" },
      { char: "😴", keywords: "sleeping zzz" },
      { char: "😷", keywords: "mask sick medical" },
      { char: "🤒", keywords: "fever thermometer sick" },
      { char: "🤕", keywords: "hurt bandage injury" },
      { char: "🤢", keywords: "nauseated gross sick" },
      { char: "🤮", keywords: "vomiting puke sick" },
      { char: "🤧", keywords: "sneezing achoo cold" },
      { char: "🥵", keywords: "hot heat warm" },
      { char: "🥶", keywords: "cold freezing ice" },
      { char: "🫠", keywords: "melting face heat liquid" },
      { char: "🫡", keywords: "saluting face respect salute" },
      { char: "🥹", keywords: "holding back tears touched happy cry" },
      { char: "🤯", keywords: "exploding mind blown shock" },
      { char: "🤠", keywords: "cowboy western hat" },
      { char: "🥳", keywords: "party celebrate birthday" },
      { char: "😎", keywords: "cool sunglasses chill" },
      { char: "🤓", keywords: "nerd glasses smart" },
      { char: "🧐", keywords: "monocle inspect curious" },
      { char: "😕", keywords: "confused puzzled unsure" },
      { char: "😟", keywords: "worried anxious concerned" },
      { char: "🙁", keywords: "slightly frowning sad" },
      { char: "😮", keywords: "open mouth wow surprised" },
      { char: "😯", keywords: "hushed shocked quiet" },
      { char: "😲", keywords: "astonished gasp amazed" },
      { char: "😳", keywords: "flushed blushing embarrassed" },
      { char: "🥺", keywords: "pleading begging puppy eyes" },
      { char: "😨", keywords: "fearful scared nervous" },
      { char: "😰", keywords: "cold sweat anxious relief" },
      { char: "😢", keywords: "sad cry tear" },
      { char: "😭", keywords: "loudly crying sob bawling" },
      { char: "😱", keywords: "scream horror fear" },
      { char: "😖", keywords: "confounded frustrated upset" },
      { char: "😣", keywords: "persevering trying hard" },
      { char: "😞", keywords: "disappointed sad regret" },
      { char: "😓", keywords: "sweat hard work stress" },
      { char: "😩", keywords: "weary exhausted done" },
      { char: "😫", keywords: "tired fed up fatigue" },
      { char: "😤", keywords: "triumph steam nose hmph" },
      { char: "🥱", keywords: "yawn sleepy bored" },
      { char: "😠", keywords: "angry mad annoyed" },
      { char: "😡", keywords: "rage furious red" },
      { char: "🙇‍♂️", keywords: "bowing man bow respect apology sorry" },
      { char: "🙇‍♀️", keywords: "bowing woman bow respect apology sorry" },
      { char: "🙇", keywords: "bowing person bow respect apology" },
      { char: "🤦‍♂️", keywords: "man facepalm smh oops" },
      { char: "🤦‍♀️", keywords: "woman facepalm smh oops" },
      { char: "🤷‍♂️", keywords: "man shrug idk who knows" },
      { char: "🤷‍♀️", keywords: "woman shrug idk who knows" },
      { char: "🤝", keywords: "handshake deal agree agreement" },
      { char: "👍", keywords: "thumbsup like good approve yes +1" },
      { char: "👎", keywords: "thumbsdown dislike bad no -1" },
      { char: "👏", keywords: "clap applaud bravos" },
      { char: "🙏", keywords: "pray please thanks hope pray high five" },
      { char: "👋", keywords: "wave hello bye greeting" },
      { char: "🤚", keywords: "raised back of hand stop" },
      { char: "✋", keywords: "raised hand stop high five" },
      { char: "🙌", keywords: "raised hands praise celebrate" },
      { char: "💪", keywords: "muscle strong flex power" },
      { char: "👊", keywords: "punch fist fight boom" },
      { char: "✊", keywords: "raised fist power solidarity" },
      { char: "✌️", keywords: "victory peace win" },
      { char: "🫰", keywords: "finger heart kpop love snap" },
      { char: "🫶", keywords: "heart hands love heart care" },
      { char: "🤌", keywords: "pinched fingers italian chef kiss" },
      { char: "🤏", keywords: "pinching hand small tiny" },
      { char: "🤞", keywords: "crossed fingers luck hope" },
      { char: "🤟", keywords: "love you hand gesture" },
      { char: "🤙", keywords: "call me hand phone chill" },
      { char: "👉", keywords: "pointing right look index" },
      { char: "👈", keywords: "pointing left back" },
      { char: "👆", keywords: "pointing up above" },
      { char: "👇", keywords: "pointing down below" },
      { char: "✍️", keywords: "writing hand pen note" },
      { char: "👀", keywords: "eyes look watch view" },
      { char: "🧠", keywords: "brain smart mind think" }
    ]
  },
  {
    id: "animals",
    name: "Animals & Nature",
    icon: Dog,
    emojis: [
      { char: "🐶", keywords: "dog puppy pet canine" },
      { char: "🐱", keywords: "cat kitten meow" },
      { char: "🐭", keywords: "mouse rat rodent" },
      { char: "🐹", keywords: "hamster pet" },
      { char: "🐰", keywords: "rabbit bunny" },
      { char: "🦊", keywords: "fox wild" },
      { char: "🐻", keywords: "bear" },
      { char: "🐼", keywords: "panda cute" },
      { char: "🐨", keywords: "koala" },
      { char: "🐯", keywords: "tiger cat wild" },
      { char: "🦁", keywords: "lion king" },
      { char: "🐮", keywords: "cow cattle farm" },
      { char: "🐷", keywords: "pig oink" },
      { char: "🐸", keywords: "frog toad" },
      { char: "🐵", keywords: "monkey ape" },
      { char: "🐔", keywords: "chicken hen farm" },
      { char: "🐧", keywords: "penguin ice" },
      { char: "🐦", keywords: "bird tweet" },
      { char: "🦅", keywords: "eagle bird America" },
      { char: "🦆", keywords: "duck quack" },
      { char: "🦉", keywords: "owl night smart" },
      { char: "🐝", keywords: "bee honey insect" },
      { char: "🐛", keywords: "caterpillar bug" },
      { char: "🦋", keywords: "butterfly beauty" },
      { char: "🐌", keywords: "snail slow" },
      { char: "🐞", keywords: "ladybug bug" },
      { char: "🐢", keywords: "turtle slow" },
      { char: "🐍", keywords: "snake danger" },
      { char: "🐙", keywords: "octopus sea" },
      { char: "🐬", keywords: "dolphin sea ocean" },
      { char: "🐳", keywords: "whale ocean" },
      { char: "🐟", keywords: "fish sea" },
      { char: "🦈", keywords: "shark danger sea" },
      { char: "🌸", keywords: "flower cherry blossom" },
      { char: "🌹", keywords: "rose flower love" },
      { char: "🌻", keywords: "sunflower summer" },
      { char: "🌱", keywords: "seedling plant grow" },
      { char: "🌲", keywords: "evergreen tree forest" },
      { char: "🌴", keywords: "palm tree tropical" },
      { char: "🌵", keywords: "cactus desert" },
      { char: "🍀", keywords: "clover lucky" },
      { char: "🍁", keywords: "maple leaf autumn" },
      { char: "🌙", keywords: "crescent moon night" },
      { char: "☀️", keywords: "sun sunny weather" },
      { char: "⭐", keywords: "star favorite rating" },
      { char: "🔥", keywords: "fire hot lit flame" },
      { char: "⚡", keywords: "zap thunder bolt electric" },
      { char: "❄️", keywords: "snowflake winter cold" },
      { char: "💨", keywords: "dash wind puff fast" }
    ]
  },
  {
    id: "food",
    name: "Food & Drink",
    icon: Pizza,
    emojis: [
      { char: "🍎", keywords: "apple fruit red" },
      { char: "🍌", keywords: "banana fruit yellow" },
      { char: "🍇", keywords: "grapes fruit" },
      { char: "🍓", keywords: "strawberry fruit" },
      { char: "🥑", keywords: "avocado food" },
      { char: "🍔", keywords: "burger hamburger fastfood" },
      { char: "🍕", keywords: "pizza fastfood slice" },
      { char: "🍟", keywords: "fries french fries" },
      { char: "🌭", keywords: "hotdog food" },
      { char: "🍿", keywords: "popcorn movie snack" },
      { char: "🥞", keywords: "pancakes breakfast" },
      { char: "🧇", keywords: "waffle breakfast" },
      { char: "🧀", keywords: "cheese food" },
      { char: "🥩", keywords: "meat steak" },
      { char: "🍗", keywords: "chicken leg food" },
      { char: "🌮", keywords: "taco mexican" },
      { char: "🌯", keywords: "burrito mexican" },
      { char: "🍣", keywords: "sushi japanese" },
      { char: "🍜", keywords: "ramen noodles" },
      { char: "🍩", keywords: "donut dessert sweet" },
      { char: "🍦", keywords: "ice cream dessert" },
      { char: "🍰", keywords: "cake birthday dessert" },
      { char: "🧁", keywords: "cupcake sweet" },
      { char: "🍫", keywords: "chocolate candy" },
      { char: "🍬", keywords: "candy sweet" },
      { char: "☕", keywords: "coffee tea drink hot" },
      { char: "🧃", keywords: "juice box drink" },
      { char: "🧋", keywords: "boba bubble tea" },
      { char: "🍺", keywords: "beer drink alcohol" },
      { char: "🍷", keywords: "wine drink alcohol" },
      { char: "🍾", keywords: "champagne celebration" }
    ]
  },
  {
    id: "activities",
    name: "Activities & Sports",
    icon: Activity,
    emojis: [
      { char: "⚽", keywords: "soccer football sport ball" },
      { char: "🏀", keywords: "basketball sport ball" },
      { char: "🏈", keywords: "american football sport" },
      { char: "⚾", keywords: "baseball sport" },
      { char: "🎾", keywords: "tennis sport" },
      { char: "🏐", keywords: "volleyball sport" },
      { char: "🏉", keywords: "rugby sport" },
      { char: "🎱", keywords: "billiards 8ball game" },
      { char: "🏓", keywords: "ping pong table tennis" },
      { char: "🏸", keywords: "badminton sport" },
      { char: "⛳", keywords: "golf sport flag" },
      { char: "🎯", keywords: "target bullseye goal" },
      { char: "🎮", keywords: "gaming controller video game" },
      { char: "🎲", keywords: "dice game luck" },
      { char: "♟️", keywords: "chess game strategy" },
      { char: "🎨", keywords: "art palette paint" },
      { char: "🎭", keywords: "theater drama acting" },
      { char: "🎤", keywords: "microphone sing music" },
      { char: "🎧", keywords: "headphones music listen" },
      { char: "🎷", keywords: "saxophone jazz music" },
      { char: "🎸", keywords: "guitar rock music" },
      { char: "🎹", keywords: "piano music instrument" },
      { char: "🥁", keywords: "drum music" },
      { char: "🏆", keywords: "trophy winner award champion" },
      { char: "🥇", keywords: "1st medal gold first" },
      { char: "🥈", keywords: "2nd medal silver second" },
      { char: "🥉", keywords: "3rd medal bronze third" },
      { char: "🎀", keywords: "ribbon bow gift cute" },
      { char: "🎗️", keywords: "reminder ribbon" },
      { char: "🎟️", keywords: "ticket admission movie" }
    ]
  },
  {
    id: "travel",
    name: "Travel & Places",
    icon: Plane,
    emojis: [
      { char: "🚗", keywords: "car auto drive" },
      { char: "🚕", keywords: "taxi cab" },
      { char: "🏎️", keywords: "racing car fast" },
      { char: "🚑", keywords: "ambulance emergency" },
      { char: "🚒", keywords: "fire engine truck" },
      { char: "🚌", keywords: "bus transit" },
      { char: "🚲", keywords: "bicycle bike cycle" },
      { char: "🛵", keywords: "scooter motor" },
      { char: "✈️", keywords: "airplane flight travel" },
      { char: "🚀", keywords: "rocket launch space ship" },
      { char: "🚁", keywords: "helicopter chopper" },
      { char: "⛵", keywords: "sailboat boat sea" },
      { char: "🚢", keywords: "ship cruise ocean" },
      { char: "⚓", keywords: "anchor port" },
      { char: "🗺️", keywords: "map travel direction" },
      { char: "🏠", keywords: "house home building" },
      { char: "🏢", keywords: "office building work" },
      { char: "🏫", keywords: "school education class" },
      { char: "🏥", keywords: "hospital doctor clinic" },
      { char: "🏦", keywords: "bank money finance" },
      { char: "🏰", keywords: "castle kingdom" }
    ]
  },
  {
    id: "objects",
    name: "Objects & Tools",
    icon: Lightbulb,
    emojis: [
      { char: "💡", keywords: "light bulb idea creative" },
      { char: "🔦", keywords: "flashlight search light" },
      { char: "👑", keywords: "crown king queen leader VIP" },
      { char: "💎", keywords: "diamond gem precious jewelry" },
      { char: "💻", keywords: "laptop computer work tech" },
      { char: "🖥️", keywords: "desktop computer pc" },
      { char: "📱", keywords: "phone mobile smartphone" },
      { char: "📞", keywords: "telephone call contact" },
      { char: "☎️", keywords: "phone classic call" },
      { char: "⏰", keywords: "alarm clock time schedule" },
      { char: "⏱️", keywords: "stopwatch timer tracking" },
      { char: "⏲️", keywords: "timer countdown" },
      { char: "⏳", keywords: "hourglass pending wait" },
      { char: "⌛", keywords: "hourglass done timer" },
      { char: "📅", keywords: "calendar date schedule" },
      { char: "📋", keywords: "clipboard task checklist" },
      { char: "📌", keywords: "pushpin pin important" },
      { char: "📎", keywords: "paperclip attach file" },
      { char: "📂", keywords: "folder file storage" },
      { char: "📁", keywords: "folder document" },
      { char: "📊", keywords: "chart graph analytics" },
      { char: "📈", keywords: "chart increasing growth" },
      { char: "📉", keywords: "chart decreasing down" },
      { char: "✏️", keywords: "pencil write edit" },
      { char: "📝", keywords: "memo note document" },
      { char: "🔒", keywords: "lock secure private" },
      { char: "🔓", keywords: "unlock open" },
      { char: "🔑", keywords: "key access secret" },
      { char: "🛠️", keywords: "hammer wrench tools config" },
      { char: "⚙️", keywords: "gear settings config" },
      { char: "💰", keywords: "money bag cash wealth" },
      { char: "💵", keywords: "dollar money cash" },
      { char: "💳", keywords: "credit card pay payment" },
      { char: "🎁", keywords: "gift present surprise" },
      { char: "✉️", keywords: "email mail letter message" }
    ]
  },
  {
    id: "symbols",
    name: "Symbols & Hearts",
    icon: Hash,
    emojis: [
      { char: "❤️", keywords: "red heart love" },
      { char: "🩷", keywords: "pink heart love" },
      { char: "🧡", keywords: "orange heart" },
      { char: "💛", keywords: "yellow heart" },
      { char: "💚", keywords: "green heart" },
      { char: "💙", keywords: "blue heart" },
      { char: "💜", keywords: "purple heart" },
      { char: "🖤", keywords: "black heart" },
      { char: "🤍", keywords: "white heart" },
      { char: "🤎", keywords: "brown heart" },
      { char: "💖", keywords: "sparkling heart" },
      { char: "💗", keywords: "growing heart" },
      { char: "💓", keywords: "beating heart" },
      { char: "💞", keywords: "revolving hearts" },
      { char: "💕", keywords: "two hearts" },
      { char: "💌", keywords: "love letter note" },
      { char: "✨", keywords: "sparkles magic shiny" },
      { char: "🎉", keywords: "tada party celebrate" },
      { char: "🎊", keywords: "confetti ball celebrate" },
      { char: "💯", keywords: "hundred 100 perfect score" },
      { char: "1️⃣", keywords: "one keycap number 1 first" },
      { char: "‼️", keywords: "double exclamation mark alert urgent" },
      { char: "❗", keywords: "exclamation mark important" },
      { char: "❓", keywords: "question mark help" },
      { char: "💥", keywords: "boom explosion collision" },
      { char: "💦", keywords: "sweat drops splash" },
      { char: "💬", keywords: "speech bubble comment chat" },
      { char: "💭", keywords: "thought bubble think" },
      { char: "🔔", keywords: "bell notification alert" },
      { char: "🔕", keywords: "bell mute silent" },
      { char: "✅", keywords: "check mark done complete success" },
      { char: "☑️", keywords: "ballot box check mark" },
      { char: "✔️", keywords: "heavy check mark" },
      { char: "❌", keywords: "cross mark cancel error fail" },
      { char: "⭕", keywords: "circle mark" },
      { char: "⚠️", keywords: "warning caution alert" },
      { char: "🚨", keywords: "police car light emergency alert" },
      { char: "⛔", keywords: "no entry stop" },
      { char: "🚫", keywords: "prohibited forbidden" }
    ]
  },
  {
    id: "flags",
    name: "Flags",
    icon: Flag,
    emojis: [
      { char: "🏁", keywords: "chequered flag finish race" },
      { char: "🚩", keywords: "triangular flag red mark" },
      { char: "🎌", keywords: "crossed flags japan" },
      { char: "🏴‍☠️", keywords: "pirate flag skull" },
      { char: "🏳️", keywords: "white flag surrender" },
      { char: "🇺🇸", keywords: "united states usa america" },
      { char: "🇬🇧", keywords: "united kingdom uk britain" },
      { char: "🇨🇦", keywords: "canada flag" },
      { char: "🇳🇬", keywords: "nigeria flag green white" },
      { char: "🇬🇭", keywords: "ghana flag" },
      { char: "🇿🇦", keywords: "south africa flag" },
      { char: "🇰🇪", keywords: "kenya flag" },
      { char: "🇩🇪", keywords: "germany flag" },
      { char: "🇫🇷", keywords: "france flag" },
      { char: "🇪🇸", keywords: "spain flag" },
      { char: "🇮🇹", keywords: "italy flag" },
      { char: "🇯🇵", keywords: "japan flag" },
      { char: "🇨🇳", keywords: "china flag" },
      { char: "🇮🇳", keywords: "india flag" },
      { char: "🇧🇷", keywords: "brazil flag" },
      { char: "🇦🇺", keywords: "australia flag" }
    ]
  }
];

const RECENT_KEY = "recent_emojis_v1";

export const getRecentEmojis = () => {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return ["👍", "✅", "🔥", "😊", "🙏", "🙇‍♂️", "😭", "💯", "👀", "🚀"];
};

export const saveRecentEmoji = (emojiChar) => {
  try {
    const list = getRecentEmojis();
    const updated = [emojiChar, ...list.filter(e => e !== emojiChar)].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {}
};

const EmojiPickerPopover = ({ onSelectEmoji, onClose, style = {}, placement = "top" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [recentEmojis, setRecentEmojis] = useState(getRecentEmojis());
  const pickerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handlePick = (emojiChar) => {
    saveRecentEmoji(emojiChar);
    setRecentEmojis(getRecentEmojis());
    if (onSelectEmoji) {
      onSelectEmoji(emojiChar);
    }
  };

  // Filter Emojis based on search query
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;

    const results = [];
    EMOJI_CATEGORIES.forEach(cat => {
      if (cat.id === "frequently") return;
      const matched = cat.emojis.filter(item => {
        const char = typeof item === "string" ? item : item.char;
        const kw = typeof item === "string" ? item : (item.keywords || "");
        return kw.toLowerCase().includes(query) || char.includes(query);
      });
      if (matched.length > 0) {
        results.push({
          name: cat.name,
          emojis: matched.map(m => typeof m === "string" ? m : m.char)
        });
      }
    });
    return results;
  }, [searchQuery]);

  return (
    <div
      ref={pickerRef}
      className="zbot-emoji-picker-popover shadow-2xl rounded-2xl border bg-white text-slate-900 overflow-hidden d-flex flex-column select-none"
      style={{
        width: "320px",
        height: "390px",
        zIndex: 100000,
        position: "absolute",
        ...(placement === "top" ? { bottom: "100%", marginBottom: "8px" } : { top: "100%", marginTop: "8px" }),
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)",
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Search & Action Bar */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 d-flex align-items-center gap-2">
        <div className="position-relative flex-grow-1">
          <Search size={14} className="position-absolute text-slate-400" style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="form-control form-control-sm bg-white border-slate-200 text-slate-900 rounded-xl ps-4 pe-2 py-1 text-xs"
            style={{ paddingLeft: "30px", fontSize: "12px" }}
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-link text-slate-400 hover:text-slate-600 p-1 text-decoration-none border-0"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Emoji Grid Body */}
      <div className="flex-grow-1 overflow-y-auto p-3 custom-emoji-scroll" style={{ scrollBehavior: "smooth" }}>
        {filteredSections ? (
          // Search Results View
          filteredSections.length > 0 ? (
            filteredSections.map((sec, idx) => (
              <div key={idx} className="mb-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  {sec.name}
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {sec.emojis.map((emojiChar, i) => (
                    <button
                      key={i}
                      type="button"
                      className="emoji-grid-btn p-1 rounded hover:bg-slate-100 transition-colors border-0 bg-transparent text-lg d-flex align-items-center justify-content-center"
                      style={{ width: "34px", height: "34px", fontSize: "20px", cursor: "pointer" }}
                      onClick={() => handlePick(emojiChar)}
                    >
                      {emojiChar}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-slate-400 text-xs font-medium">
              No emojis match "{searchQuery}"
            </div>
          )
        ) : (
          // Category Sections View
          <>
            {/* Frequently Used / Recent */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1 d-flex justify-content-between align-items-center">
                <span>Frequently Used</span>
              </div>
              <div className="d-flex flex-wrap gap-1">
                {recentEmojis.map((emojiChar, i) => (
                  <button
                    key={i}
                    type="button"
                    className="emoji-grid-btn p-1 rounded hover:bg-slate-100 transition-colors border-0 bg-transparent text-lg d-flex align-items-center justify-content-center"
                    style={{ width: "34px", height: "34px", fontSize: "20px", cursor: "pointer" }}
                    onClick={() => handlePick(emojiChar)}
                  >
                    {emojiChar}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Categories */}
            {EMOJI_CATEGORIES.filter(c => c.id !== "frequently").map((cat) => {
              if (activeCategory !== "all" && activeCategory !== cat.id) return null;
              return (
                <div key={cat.id} className="mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    {cat.name}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {cat.emojis.map((item, i) => {
                      const char = typeof item === "string" ? item : item.char;
                      return (
                        <button
                          key={i}
                          type="button"
                          className="emoji-grid-btn p-1 rounded hover:bg-slate-100 transition-colors border-0 bg-transparent text-lg d-flex align-items-center justify-content-center"
                          style={{ width: "34px", height: "34px", fontSize: "20px", cursor: "pointer" }}
                          onClick={() => handlePick(char)}
                          title={typeof item === "object" ? item.keywords : ""}
                        >
                          {char}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Category Tab Bar (Bottom) */}
      <div className="p-1.5 border-t border-slate-100 bg-slate-50/90 d-flex align-items-center justify-content-around">
        {EMOJI_CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm p-1.5 border-0 rounded-lg transition-colors d-flex align-items-center justify-content-center ${
                isActive ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
              style={{ width: "30px", height: "30px" }}
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(cat.id);
              }}
              title={cat.name}
            >
              <IconComp size={15} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiPickerPopover;
