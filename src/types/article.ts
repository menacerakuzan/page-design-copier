/** A video embedded within an article body. */
export type ArticleVideo = {
  id: string;
  url: string;
  /** 0 = before the text, N = after the Nth paragraph */
  afterParagraph: number;
};
