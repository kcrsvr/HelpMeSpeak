import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  // First run
  Splash: undefined;
  Onboarding: undefined;

  // Child mode
  ChildHome: undefined;
  Category: { categoryId: string; categoryName: string };
  WordExperience: { wordId: string };

  // Caregiver mode
  PinGate: undefined;
  CaregiverHome: undefined;
  WordWizard: { wordId?: string } | undefined; // wordId present => edit
  ManageCategories: undefined;
  ManageProfiles: undefined;
  ProfileSettings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
