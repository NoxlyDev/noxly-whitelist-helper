import sharp, { type ResizeOptions, type Sharp } from 'sharp';

/** A preprocessing recipe: which page-segmentation mode to use and how to prepare the image. */
export interface Recipe {
  name: string;
  psm: 6 | 11;
  prepare: (buffer: Buffer) => Sharp;
}

const base = (
  buf: Buffer,
  width: number,
  kernel: NonNullable<ResizeOptions['kernel']> = 'lanczos3',
) => sharp(buf).flatten({ background: '#000' }).resize({ width, kernel }).greyscale();

/** Fast, broad recipes; run first and exit early on a match. */
export const STAGE1: Recipe[] = [
  { name: 'psm11-inverted-1200', psm: 11, prepare: (b) => base(b, 1200).normalize().negate() },
  {
    // small UI / pixel font
    name: 'psm11-pixel-1600',
    psm: 11,
    prepare: (b) => base(b, 1600, 'nearest').normalize().blur(1.2).negate(),
  },
  { name: 'psm6-inverted-1200', psm: 6, prepare: (b) => base(b, 1200).normalize().negate() },
];

/** Slower recipes for tilted / blurred / dark photos; only run when stage 1 found a hint. */
export const STAGE2: Recipe[] = [
  ...[-5, -3, 3, 5].map((deg): Recipe => ({
    name: `psm11-deskew-${deg}`,
    psm: 11,
    prepare: (b) =>
      sharp(b)
        .flatten({ background: '#000' })
        .rotate(deg, { background: '#000' })
        .resize({ width: 1600 })
        .greyscale()
        .normalize()
        .blur(1)
        .negate(),
  })),
  {
    name: 'psm6-lowlight-2000',
    psm: 6,
    prepare: (b) => base(b, 2000).blur(1.5).normalize().linear(1.6, -60).negate(),
  },
  { name: 'psm11-dark-on-light-1600', psm: 11, prepare: (b) => base(b, 1600).normalize() },
];
