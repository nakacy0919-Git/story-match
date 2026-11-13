import React from "react";
import {render,screen,cleanup} from "@testing-library/react";
import App from "./App";
import {parseJoinCode,parseObserverToken,readLocalLiveRecord,LIVE_METRICS} from "./utils/liveClassroom";
import {readUnitStudy,saveQuizResult} from "./utils/studyProgress";

beforeEach(()=>window.localStorage.clear());
test("observer and learner links use separate hash routes, leaving secrets out of query strings",()=>{
  expect(parseObserverToken("#/observe?token=OBS123")).toBe("OBS123");
  expect(parseObserverToken("#/join?code=12ABC")).toBe("");
  expect(parseJoinCode("#/join?code=abcc34")).toBe("ABCC34");
  expect(parseJoinCode("#/observe?token=something")).toBe("");
});
test("live snapshot sends exactly both units and existing eleven-progress categories",()=>{
  const student={class:"3-6",number:"3",name:"Test Student"};
  localStorage.setItem("storyMatchStudent",JSON.stringify(student));
  saveQuizResult(11,"vocabulary","enJa",80);
  saveQuizResult(12,"comprehension","ja",100);
  const snapshot=readLocalLiveRecord();
  expect(snapshot.student).toEqual(student);
  expect(Object.keys(snapshot.units)).toEqual(["11","12"]);
  expect(Object.keys(snapshot.units["11"].metrics)).toEqual(LIVE_METRICS.map(v=>v[0]));
  expect(LIVE_METRICS).toHaveLength(11);
  expect(snapshot.units["11"].metrics).not.toHaveProperty("shadow");
  expect(snapshot.units["11"].metrics.vocabE).toBe(80);
  expect(snapshot.units["12"].metrics.compJa).toBe(100);
  expect(snapshot.units["12"].workbook).toHaveProperty("workbookGrammar");
  expect(readUnitStudy(student,11).vocabulary.enJa.best).toBe(80);
});
 

test("teacher controls and observer dashboard are reachable through their own QR routes",()=>{
  const previous=window.location.hash;
  try {
    window.location.hash="#/live-admin";
    const teacher=render(React.createElement(App));
    expect(screen.getByText("授業観察ライブ｜管理画面")).toBeTruthy();
    expect(screen.getByText("管理者パスワード")).toBeTruthy();
    teacher.unmount();
    window.location.hash="#/observe";
    const viewer=render(React.createElement(App));
    expect(screen.getByText("公開授業｜学習進捗ダッシュボード")).toBeTruthy();
    viewer.unmount();
  } finally {
    window.location.hash=previous;
    cleanup();
  }
});
