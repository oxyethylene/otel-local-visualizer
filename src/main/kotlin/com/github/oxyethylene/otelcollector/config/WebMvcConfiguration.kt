package com.github.oxyethylene.otelcollector.config

import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.method.HandlerTypePredicate
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport
import org.springframework.web.servlet.resource.PathResourceResolver

@Configuration
class WebMvcConfiguration : WebMvcConfigurationSupport() {
    override fun configurePathMatch(configurer: PathMatchConfigurer) {
        configurer.addPathPrefix("/api/v1", HandlerTypePredicate.forAnnotation(RestController::class.java))
    }

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource? {
                    if (resourcePath.isEmpty()) return ClassPathResource("static/index.html")
                    val requested = ClassPathResource("static/$resourcePath")
                    // Serve the requested file if it exists, otherwise fall back to index.html for SPA routing
                    return if (requested.exists()) requested else ClassPathResource("static/index.html")
                }
            })
    }
}
