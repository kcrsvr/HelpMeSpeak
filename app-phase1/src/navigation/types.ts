import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  // First run
  Splash: undefined;
  Onboarding: undefined;

  // Child mode
  ChildHome: undefined;
  Category: { categoryId: string; categoryName: string };
  Favorites: undefined;
  WordExperience: { wordId: string };

  // Caregiver mode
  PinGate: undefined;
  CaregiverHome: undefined;
  // wordId present => edit; categoryId preselects the category when adding
  WordWizard: { wordId?: string; categoryId?: string } | undefined;
  ManageCategories: undefined;
  CategoryDetail: { categoryId: string };
  ManageProfiles: undefined;
  ProfileSettings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
