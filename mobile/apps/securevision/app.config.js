// Dynamic layer over app.json. app.json stays the single source of truth for the
// production identity; this file only applies development-time overrides.
//
// GAITAI_IOS_PERSONAL_TEAM=1   Free Apple ID / Xcode "Personal Team" installs. Apple binds an
//                              explicit App ID to the first team that registers it, so the
//                              production bundle identifier must never be signed with a
//                              personal team. This switch appends ".dev" to the iOS bundle
//                              identifier and " Dev" to the name. Android is untouched.
// GAITAI_APPLE_TEAM_ID=XXXXXXXXXX  Optional. Lets `npx expo run:ios --device` sign without
//                              opening Xcode first (the ten-character team id from Xcode →
//                              Settings → Accounts, or developer.apple.com/account).
module.exports = ({ config }) => {
  const personal = process.env.GAITAI_IOS_PERSONAL_TEAM === "1";
  const teamId = process.env.GAITAI_APPLE_TEAM_ID;
  const ios = { ...config.ios };
  if (personal) ios.bundleIdentifier = `${ios.bundleIdentifier}.dev`;
  if (teamId) ios.appleTeamId = teamId;
  return {
    ...config,
    name: personal ? `${config.name} Dev` : config.name,
    ios,
  };
};
