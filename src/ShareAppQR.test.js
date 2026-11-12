import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ShareAppQR, { STORY_MATCH_SHARE_URL } from "./components/ShareAppQR";

test("Learning Progress QR shares the actual production homepage, not a preview or student record",()=>{
  render(<ShareAppQR/>);
  const link=screen.getByRole("link",{name:"友達にStory Matchを紹介するQRコード"});
  expect(link).toHaveAttribute("href","https://story-match.vercel.app/");
  expect(STORY_MATCH_SHARE_URL).toBe("https://story-match.vercel.app/");
  expect(link).toHaveAttribute("rel","noopener noreferrer");
  expect(screen.getByRole("img",{name:"Story Match公式サイトへのQRコード"})).toBeInTheDocument();
});