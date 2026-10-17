import {
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from 'discord.js';
import { replyContent } from './content.js';

const text = (md: string) => new TextDisplayBuilder().setContent(md);
const divider = () =>
  new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

/** Components V2 reply explaining how to fix the "not invited" error. */
export function buildWhitelistReply() {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(text(replyContent.main))
    .addSeparatorComponents(divider())
    .addTextDisplayComponents(text(replyContent.other));

  return { components: [container], flags: MessageFlags.IsComponentsV2 } as const;
}
