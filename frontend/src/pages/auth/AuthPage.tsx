import React from 'react';
import { Authenticator, useTheme, View, Text } from '@aws-amplify/ui-react';
import { LoginHeader } from './LoginHeader';

// Customizing the Authenticator components
const components = {
  Header() {
    return <LoginHeader />;
  },
  Footer() {
    return (
      <View className="text-center p-4">
        <Text className="text-xs text-gray-400">
          © 2026 VinciFlow AI. Secured by AWS Cognito.
        </Text>
      </View>
    );
  }
};

interface AuthPageProps {
  children: React.ReactNode;
}

export default function AuthPage({ children }: AuthPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* The Authenticator handles the entire state. 
        If not logged in, it shows the form. 
        If logged in, it renders the function below.
      */}
      <Authenticator 
            loginMechanisms={['email']} // This tells Amplify to treat the field as an Email
            components={components}
    >
        {({ signOut, user }) => (
          <div className="w-full h-full">
            {/* We pass the user and signOut function to the children 
               so your ChatPage can display the user's name or log them out.
            */}
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { 
                  signOut, 
                  user 
                });
              }
              return child;
            })}
          </div>
        )}
      </Authenticator>
    </div>
  );
}