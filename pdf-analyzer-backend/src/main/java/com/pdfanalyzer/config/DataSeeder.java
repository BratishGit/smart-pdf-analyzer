package com.pdfanalyzer.config;

import com.pdfanalyzer.entity.User;
import com.pdfanalyzer.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("bratish")) {
                User demoUser = User.builder()
                        .username("bratish")
                        .email("bratish@demo.com")
                        .password(passwordEncoder.encode("password"))
                        .fullName("Demo User (Bratish)")
                        .build();
                userRepository.save(demoUser);
                System.out.println("====== SEEDED DEMO USER 'bratish' ======");
            }
        };
    }
}
