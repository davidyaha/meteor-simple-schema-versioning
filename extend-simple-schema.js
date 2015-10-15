/**
 * Created by David Yahalomi on 15/10/2015.
 */
SimpleSchema.extendOptions({
  type: Match.Optional(Match.Any),
  removed: Match.Optional(Boolean),
  renamed: Match.Optional(String)
});
