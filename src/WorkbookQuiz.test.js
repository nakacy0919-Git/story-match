import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import {workbookReading} from "./workbookReading";
import {workbookGrammar} from "./workbookGrammar";
import {workbookVarious,workbookListeningPending} from "./workbookVarious";
import {getWorkbookQuestions,normalizeWorkbookAnswer,validShort,matchesOrder} from "./components/WorkbookQuizPanel";
import {readUnitStudy} from "./utils/studyProgress";

beforeEach(()=>{localStorage.clear();window.speechSynthesis={cancel:jest.fn(),speak:jest.fn(),getVoices:()=>[]};});
afterEach(cleanup);
const visit=(unit=10)=>{
 render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Unit "+unit}));
};
test("all supplied Units 10–15 have three strictly separate, source-page-indexed question banks",()=>{
 const counts={10:[12,7,2],11:[10,9,2],12:[8,11,2],13:[13,9,3],14:[12,10,2],15:[10,9,4]};
 for(const [unit,expected] of Object.entries(counts)){
  const n=Number(unit);
  const parts=[workbookReading[n],workbookGrammar[n],workbookVarious[n]];
  expect(parts.map(a=>a.length)).toEqual(expected);
  const all=parts.flat();
  expect(all.length).toBeGreaterThanOrEqual(17);
  expect(new Set(all.map(q=>q.page)).size).toBeGreaterThanOrEqual(3);
  for(const question of all){
   expect(question.prompt.length).toBeGreaterThan(5);
   expect(question.section.length).toBeGreaterThan(2);
   expect(question.page).toBeGreaterThanOrEqual(40);
   expect(question.page).toBeLessThanOrEqual(63);
   if(question.type==="choice"){
     expect(question.options.length).toBeGreaterThanOrEqual(2);
     expect(question.answer).toBeGreaterThanOrEqual(0);
     expect(question.answer).toBeLessThan(question.options.length);
     expect(new Set(question.options).size).toBe(question.options.length);
   }
   if(question.type==="multi"){
     expect(question.options.length).toBeGreaterThanOrEqual(3);
     expect(new Set(question.answer).size).toBe(question.answer.length);
     question.answer.forEach(i=>expect(question.options[i]).toBeTruthy());
   }
   if(question.type==="short")expect(question.answers.length).toBeGreaterThan(0);
   if(question.type==="written")expect(question.answer.length).toBeGreaterThan(8);
   if(question.type==="order"){
      expect(question.tokens.length).toBeGreaterThanOrEqual(4);
      expect(normalizeWorkbookAnswer(question.tokens.join("")).length).toBeGreaterThan(5);
   }
  }
  expect(workbookListeningPending[n].reason).toMatch(/未提供/);
 }
});
test("case, spacing and full-width numerals do not cause false grading errors",()=>{
 expect(validShort(" 85％ ",["85%"])).toBe(true);
 expect(validShort("NOT EATING",["not eating"])).toBe(true);
 expect(validShort("more slowly",["more beautiful"])).toBe(false);
 expect(matchesOrder(["The","small","car","is","red"],[0,1,2,3,4],"The small car is red.")).toBe(true);
 expect(matchesOrder(["The","small","car","is","red"],[2,0,1,3,4],"The small car is red.")).toBe(false);
});
test("Unit10 shows three separate workbook categories alongside the remaining 11 learning skills",()=>{
 visit(10);
 expect(document.querySelectorAll(".th-analytics-card")).toHaveLength(11);
 expect(document.querySelectorAll(".th-wb-dashboard-card")).toHaveLength(3);
 expect(screen.getByRole("button",{name:/Reading Questions.*問題集の読解設問/})).toBeInTheDocument();
 expect(screen.getByRole("button",{name:/Grammar & Writing.*問題集の文法・英作文/})).toBeInTheDocument();
 expect(screen.getByRole("button",{name:/Various Questions.*問題集の語彙・主題/})).toBeInTheDocument();
});
test("Reading questions support multi-select with correct answer explanation",()=>{
 visit(10);
 fireEvent.click(screen.getByRole("button",{name:/Reading Questions.*問題集の読解設問/}));
 expect(screen.getByRole("heading",{name:/Reading Questions/})).toBeInTheDocument();
 expect(screen.getByText(/p\.41/)).toBeInTheDocument();
 // The first question asks for the worldwide lucky number.
 const seven=document.querySelectorAll(".th-workbook-option")[2];
 fireEvent.click(seven);
 fireEvent.click(screen.getByRole("button",{name:"判定する"}));
 expect(screen.getAllByText(/正解！/).length).toBeGreaterThanOrEqual(1);
 expect(screen.getAllByText(/第1段落/).length).toBeGreaterThanOrEqual(1);
});
test("Grammar & Writing keeps a separate practice and can grade a short answer",()=>{
 visit(14);
 fireEvent.click(screen.getByRole("button",{name:/Grammar & Writing.*問題集の文法・英作文/}));
 expect(screen.getByRole("heading",{name:/Grammar & Writing/})).toBeInTheDocument();
 expect(screen.getByText(/p\.58/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole("textbox",{name:"空所の解答"}),{target:{value:"easier"}});
 fireEvent.click(screen.getByRole("button",{name:"判定する"}));
 expect(screen.getByText("easier")).toBeInTheDocument();
});
test("Various Questions never guesses answers for unavailable listening audio",()=>{
 visit(15);
 fireEvent.click(screen.getByRole("button",{name:/Various Questions.*問題集の語彙・主題/}));
 expect(screen.getByRole("heading",{name:/Various Questions/})).toBeInTheDocument();
 expect(screen.getAllByText(/p\.63/).length).toBeGreaterThanOrEqual(1);
 fireEvent.click(screen.getByText(/Listening：p\.63/));
 expect(screen.getByText(/原音源が未提供/)).toBeInTheDocument();
});
test("Workbook progress is saved independently from the other kinds of reading practice",()=>{
 const student={class:"3-2",number:"21",name:"Workbook Test"};
 localStorage.setItem("storyMatchStudent",JSON.stringify(student));
 visit(10);
 fireEvent.click(screen.getByRole("button",{name:/Various Questions.*問題集の語彙・主題/}));
 const first=screen.getByRole("button",{name:/ことわざ/});
 fireEvent.click(first);
 fireEvent.click(screen.getByRole("button",{name:"判定する"}));
 expect(screen.getAllByText(/正解！/).length).toBeGreaterThanOrEqual(1);
 expect(readUnitStudy(student,10).vocabulary).toBeUndefined();
 expect(readUnitStudy(student,10).workbookVarious).toBeUndefined(); // save only after completing the category
});
