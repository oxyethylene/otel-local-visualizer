package com.github.oxyethylene.otelcollector.web

import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class IndexController {
    @GetMapping("/")
    fun index(): ResponseEntity<Resource> {
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(ClassPathResource("static/index.html"))
    }
}
