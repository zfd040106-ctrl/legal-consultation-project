package com.example.lawconsultserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.example.lawconsultserver.mapper")
public class LawConsultServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(LawConsultServerApplication.class, args);
    }

}
