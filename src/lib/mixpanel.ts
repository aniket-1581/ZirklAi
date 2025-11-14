import { Mixpanel } from 'mixpanel-react-native';

let mixpanel: Mixpanel | null = null;

export const initMixpanel = async () => {
  mixpanel = new Mixpanel(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!, true);
  await mixpanel.init();
};

export const track = (event: string, props?: object) => {
  mixpanel?.track(event, props);
};

export const identify = (id: string) => {
  mixpanel?.identify(id);
};

export const setUserProps = (props: object) => {
  mixpanel?.getPeople().set(props);
};

export const resetMixpanel = () => {
  mixpanel?.reset();
};
