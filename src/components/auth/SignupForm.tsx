import { useState } from 'react';
import { 
  VStack, 
  Box,
  Heading, 
  Input, 
  Button, 
  Text, 
  Link as ChakraLink,
  Spinner
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface SignupFormProps {
  onToggleForm?: () => void;
}

export const SignupForm = ({ onToggleForm }: SignupFormProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const { register } = useAuth();

  const validateForm = () => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      await register(username, email, password);
      // Success message handled by context
    } catch (err: any) {
      setFormErrors({
        general: err.response?.data?.message || 'Failed to create account'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box 
      w="100%" 
      maxW="400px" 
      p={6} 
      borderRadius="lg" 
      boxShadow="xl" 
      bg="gray.800"
    >
      <VStack gap={4} as="form" onSubmit={handleSubmit}>
        <Heading size="lg" color="white" mb={2}>
          Create Account
        </Heading>
        
        {formErrors.general && (
          <Text color="red.300" fontSize="sm">
            {formErrors.general}
          </Text>
        )}
        
        <Box w="100%">
          <Text color="gray.300" mb={1}>Username</Text>
          <Input
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            bg="gray.700"
            color="white"
            borderColor="gray.600"
            _hover={{ borderColor: 'gray.500' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
          />
          {formErrors.username && (
            <Text color="red.300" fontSize="sm" mt={1}>
              {formErrors.username}
            </Text>
          )}
        </Box>
        
        <Box w="100%">
          <Text color="gray.300" mb={1}>Email</Text>
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="gray.700"
            color="white"
            borderColor="gray.600"
            _hover={{ borderColor: 'gray.500' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
          />
          {formErrors.email && (
            <Text color="red.300" fontSize="sm" mt={1}>
              {formErrors.email}
            </Text>
          )}
        </Box>
        
        <Box w="100%">
          <Text color="gray.300" mb={1}>Password</Text>
          <Input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            bg="gray.700"
            color="white"
            borderColor="gray.600"
            _hover={{ borderColor: 'gray.500' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
          />
          {formErrors.password && (
            <Text color="red.300" fontSize="sm" mt={1}>
              {formErrors.password}
            </Text>
          )}
        </Box>
        
        <Box w="100%">
          <Text color="gray.300" mb={1}>Confirm Password</Text>
          <Input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            bg="gray.700"
            color="white"
            borderColor="gray.600"
            _hover={{ borderColor: 'gray.500' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
          />
          {formErrors.confirmPassword && (
            <Text color="red.300" fontSize="sm" mt={1}>
              {formErrors.confirmPassword}
            </Text>
          )}
        </Box>
        
        <Button
          type="submit"
          colorScheme="blue"
          size="md"
          width="full"
          mt={2}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" /> : 'Sign Up'}
        </Button>
        
        <Text fontSize="sm" color="gray.400" mt={2}>
          Already have an account?{' '}
          {onToggleForm ? (
            <ChakraLink color="blue.400" onClick={onToggleForm}>
              Log in
            </ChakraLink>
          ) : (
            <ChakraLink color="blue.400">
              <Link to="/login">Log in</Link>
            </ChakraLink>
          )}
        </Text>
      </VStack>
    </Box>
  );
}; 