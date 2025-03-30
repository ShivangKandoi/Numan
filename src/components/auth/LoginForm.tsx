import { useState } from 'react';
import { 
  VStack, 
  Box,
  Heading, 
  Text,
  Input,
  Button,
  Link as ChakraLink,
  Spinner
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onToggleForm?: () => void;
}

export const LoginForm = ({ onToggleForm }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login } = useAuth();

  const validateForm = () => {
    const errors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
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
      await login(email, password);
      
      // Success message handled by context
    } catch (err: any) {
      setFormErrors({
        general: err.response?.data?.message || 'Failed to login'
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
      <VStack 
        as="form" 
        gap={4} 
        onSubmit={handleSubmit}
      >
        <Heading size="lg" color="white" mb={2}>
          Login
        </Heading>
        
        {formErrors.general && (
          <Text color="red.300" fontSize="sm">
            {formErrors.general}
          </Text>
        )}
        
        <Box w="100%">
          <Text color="gray.300" mb={1}>Email</Text>
          <Input
            type="email"
            placeholder="Your email"
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
            placeholder="Your password"
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
        
        <Button
          type="submit"
          colorScheme="blue"
          size="md"
          width="full"
          mt={2}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" /> : 'Log In'}
        </Button>
        
        <Text fontSize="sm" color="gray.400" mt={2}>
          Don't have an account?{' '}
          {onToggleForm ? (
            <ChakraLink color="blue.400" onClick={onToggleForm}>
              Sign up
            </ChakraLink>
          ) : (
            <ChakraLink color="blue.400">
              <Link to="/signup">Sign up</Link>
            </ChakraLink>
          )}
        </Text>
      </VStack>
    </Box>
  );
}; 