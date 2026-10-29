// Same rule the shared useDebounceSearch hook applies: drop emoji so they never reach a LIKE query,
// plus the zero-width joiners / variation selectors that travel with emoji sequences.
const EMOJI_RE =
    /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}|\u200D|\uFE0E|\uFE0F/gu;

export const sanitizeSearchText = (value: string): string => value.replace(EMOJI_RE, '').trimStart();
