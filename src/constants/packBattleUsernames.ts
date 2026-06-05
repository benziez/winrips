/** Bot opponent handles for Pack Battles matchmaking. */
export const PACK_BATTLE_BOT_USERNAMES = [
  "@charizard_king",
  "@ripgod_404",
  "@grail_hunte_r",
  "@packmaster_fl",
  "@mewtwo_pulls",
  "@shiny_hunter_",
  "@tcg_legend99",
  "@pikachu_volt",
  "@umbreon_moon",
  "@rayquaza_ace",
  "@gengar_ghost",
  "@lugia_ocean",
  "@mew_151",
  "@blastoise_h2o",
  "@venusaur_leaf",
  "@dragonite_sky",
  "@gyarados_rage",
  "@eevee_evo",
  "@snorlax_nap",
  "@jigglypuff_x",
  "@machamp_flex",
  "@alakazam_mind",
  "@garchomp_dr",
  "@sylveon_pink",
  "@greninja_stealth",
  "@lucario_aura",
  "@gardevoir_psy",
  "@tyranitar_rock",
  "@salamence_fly",
  "@metagross_steel",
  "@latios_speed",
  "@latias_heart",
  "@dialga_time",
  "@palkia_space",
  "@giratina_void",
  "@arceus_god",
  "@zoroark_trick",
  "@decidueye_owl",
  "@incineroar_rawr",
  "@primarina_sing",
  "@miraidon_ex",
  "@koraidon_ex",
  "@giratina_alt",
  "@moonbreon_hunt",
  "@psa10_chaser",
  "@first_ed_99",
  "@god_pack_pull",
  "@waifu_vault",
  "@obsidian_king",
  "@prismatic_sir",
  "@mega_evolve_x",
] as const;

export const PACK_BATTLE_AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A78BFA",
  "#F97316",
  "#22D3EE",
  "#F472B6",
  "#34D399",
  "#FB923C",
  "#818CF8",
] as const;

export function pickRandomBattleBot(): { username: string; avatarColor: string; initial: string } {
  const username =
    PACK_BATTLE_BOT_USERNAMES[Math.floor(Math.random() * PACK_BATTLE_BOT_USERNAMES.length)]!;
  const avatarColor =
    PACK_BATTLE_AVATAR_COLORS[Math.floor(Math.random() * PACK_BATTLE_AVATAR_COLORS.length)]!;
  const handle = username.replace(/^@/, "");
  const initial = (handle[0] ?? "?").toUpperCase();
  return { username, avatarColor, initial };
}
