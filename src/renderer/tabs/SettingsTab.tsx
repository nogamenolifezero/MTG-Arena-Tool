/* eslint-disable @typescript-eslint/camelcase */
import React from "react";
import { useSelector } from "react-redux";

import {
  SETTINGS_BEHAVIOUR,
  SETTINGS_ARENA_DATA,
  SETTINGS_OVERLAY,
  SETTINGS_VISUAL,
  SETTINGS_SHORTCUTS,
  SETTINGS_PRIVACY,
  SETTINGS_ABOUT,
  SETTINGS_LOGIN,
  IPC_ALL,
  IPC_RENDERER,
} from "../../shared/constants";

import store, { AppState } from "../../shared/redux/stores/rendererStore";
import SectionBehaviour from "../components/settings/SectionBehaviour";
import SectionData from "../components/settings/SectionData";
import SectionOverlay from "../components/settings/sectionOverlay";
import SectionVisual from "../components/settings/sectionVisual";
import SectionShortcuts from "../components/settings/SectionShortcuts";
import SectionPrivacy from "../components/settings/SectionPrivacy";
import SectionAbout from "../components/settings/SectionAbout";
import SectionLogin from "../components/settings/SectionLogin";
import { reduxAction } from "../../shared/redux/sharedRedux";

import appCss from "../app/app.css";
import indexCss from "../index.css";
import css from "./SettingsTab.css";

interface SettingsNavProps {
  component: () => JSX.Element;
  id: number;
  title: string;
  currentTab: number;
  callback: React.Dispatch<React.SetStateAction<number>>;
}

function SettingsNav(props: SettingsNavProps): JSX.Element {
  const click = (): void => {
    props.callback(props.id);
  };

  return (
    <div
      className={`${css.settingsNav} ${
        props.currentTab == props.id ? css.navSelected : ""
      }`}
      onClick={click}
    >
      {props.title}
    </div>
  );
}

interface SettingsProps {
  openSection?: number;
}

/**
 * Settings
 * @param props openSection: number
 */
export default function SettingsTab(props: SettingsProps): JSX.Element {
  const settings = useSelector((state: AppState) => state.settings);
  const openSection =
    (props.openSection === -1
      ? settings.last_settings_section
      : props.openSection) ?? settings.last_settings_section;
  const [currentTab, setCurrentTab] = React.useState(openSection);
  React.useEffect(() => setCurrentTab(openSection), [openSection]);

  const defaultTab = {
    currentTab: currentTab,
    callback: setCurrentTab,
  };

  React.useEffect(() => {
    reduxAction(
      store.dispatch,
      "SET_SETTINGS",
      { last_settings_section: currentTab },
      IPC_ALL ^ IPC_RENDERER
    );
  }, [currentTab]);

  const tabs: SettingsNavProps[] = [];
  tabs[SETTINGS_BEHAVIOUR] = {
    ...defaultTab,
    id: SETTINGS_BEHAVIOUR,
    component: SectionBehaviour,
    title: "Behaviour",
  };
  tabs[SETTINGS_ARENA_DATA] = {
    ...defaultTab,
    id: SETTINGS_ARENA_DATA,
    component: SectionData,
    title: "Arena Data",
  };
  tabs[SETTINGS_OVERLAY] = {
    ...defaultTab,
    id: SETTINGS_OVERLAY,
    component: SectionOverlay,
    title: "Overlays",
  };
  tabs[SETTINGS_VISUAL] = {
    ...defaultTab,
    id: SETTINGS_VISUAL,
    component: SectionVisual,
    title: "Visual",
  };
  tabs[SETTINGS_SHORTCUTS] = {
    ...defaultTab,
    id: SETTINGS_SHORTCUTS,
    component: SectionShortcuts,
    title: "Shortcuts",
  };
  tabs[SETTINGS_PRIVACY] = {
    ...defaultTab,
    id: SETTINGS_PRIVACY,
    component: SectionPrivacy,
    title: "Privacy",
  };
  tabs[SETTINGS_ABOUT] = {
    ...defaultTab,
    id: SETTINGS_ABOUT,
    component: SectionAbout,
    title: "About",
  };
  tabs[SETTINGS_LOGIN] = {
    ...defaultTab,
    id: SETTINGS_LOGIN,
    component: SectionLogin,
    title: "Login",
  };

  const CurrentSettings = tabs[currentTab].component;
  return (
    <div className={appCss.uxItem}>
      <div className={indexCss.centeredUx} style={{ flexDirection: "row" }}>
        <div className={`${indexCss.wrapperColumn} ${css.sidebar_column_r}`}>
          <SettingsNav {...tabs[SETTINGS_BEHAVIOUR]} />
          <SettingsNav {...tabs[SETTINGS_ARENA_DATA]} />
          <SettingsNav {...tabs[SETTINGS_OVERLAY]} />
          <SettingsNav {...tabs[SETTINGS_VISUAL]} />
          <SettingsNav {...tabs[SETTINGS_SHORTCUTS]} />
          <SettingsNav {...tabs[SETTINGS_PRIVACY]} />
          <SettingsNav {...tabs[SETTINGS_ABOUT]} />
          <SettingsNav {...tabs[SETTINGS_LOGIN]} />
        </div>
        <div className={`${indexCss.wrapperColumn} ${css.settings_page}`}>
          <div className={css.settingsTitle}>{tabs[currentTab].title}</div>
          <CurrentSettings />
        </div>
      </div>
    </div>
  );
}
